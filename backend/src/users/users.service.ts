import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { UserRole } from '../auth/enums/user-role.enum';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

import { IsEmail, IsNotEmpty, IsOptional, IsString, IsEnum, IsBoolean, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(UserRole, { message: 'Invalid user role' })
  @IsNotEmpty({ message: 'Role is required' })
  role: UserRole; // ADMIN can specify Staff or Staff Member
}

export class UpdateUserDto {
  @IsEmail({}, { message: 'Invalid email format' })
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(UserRole, { message: 'Invalid user role' })
  @IsOptional()
  role?: UserRole;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

@Injectable()
export class UsersService {
  private supabaseAdmin: SupabaseClient;

  constructor(
    private databaseService: DatabaseService,
    private configService: ConfigService,
  ) {
    this.supabaseAdmin = createClient(
      this.configService.get<string>('SUPABASE_URL') || '',
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') || '',
    );
  }

  private get supabase() {
    return this.databaseService.getClient();
  }

  /**
   * CREATE USER (ADMIN ONLY)
   * Only Admin can create Staff and Staff Member users
   * Cannot create other Admins
   */
  async create(createUserDto: CreateUserDto, adminRole: UserRole) {
    // Only Admin can create users
    if (adminRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only Admin can create users');
    }

    // Admin cannot create other Admins
    if (createUserDto.role === UserRole.ADMIN) {
      throw new BadRequestException('Cannot create Admin users. Admin users can only be created via registration.');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(createUserDto.email)) {
      throw new BadRequestException('Invalid email format');
    }

    // Validate password strength
    if (createUserDto.password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }

    // Check if user already exists
    const { data: existingUser } = await this.supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', createUserDto.email)
      .single();

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    try {
      // 1. Create user in Supabase Auth
      const { data: authData, error: authError } = await this.supabaseAdmin.auth.admin.createUser({
        email: createUserDto.email,
        password: createUserDto.password,
        email_confirm: true,
        user_metadata: {
          role: createUserDto.role,
          name: createUserDto.name || createUserDto.email.split('@')[0],
        },
      });

      if (authError) {
        throw new BadRequestException(`Failed to create auth user: ${authError.message}`);
      }

      // 2. Create user record in database
      const { data: user, error: userError } = await this.supabaseAdmin
        .from('users')
        .insert({
          id: authData.user.id,
          email: createUserDto.email,
          name: createUserDto.name || createUserDto.email.split('@')[0],
          role: createUserDto.role,
          is_active: true,
          created_at: new Date().toISOString(),
        })
        .select('id, email, name, role, is_active, created_at')
        .single();

      if (userError) {
        // Rollback: Delete auth user if DB insert fails
        await this.supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        throw new BadRequestException(`Failed to create user record: ${userError.message}`);
      }

      return {
        ...user,
        createdAt: user.created_at,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to create user');
    }
  }

  /**
   * FIND ALL USERS (ADMIN ONLY)
   * List all users with pagination
   */
  async findAll(adminRole: UserRole, page: number = 1, pageSize: number = 20) {
    if (adminRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only Admin can view all users');
    }

    const offset = Math.max(0, (page - 1) * pageSize);

    const { data, count, error } = await this.supabaseAdmin
      .from('users')
      .select('id, email, name, role, is_active, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) {
      throw new BadRequestException(`Failed to fetch users: ${error.message}`);
    }

    return {
      data: (data || []).map((user: any) => ({
        ...user,
        createdAt: user.created_at,
      })),
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  }

  /**
   * FIND USER BY ID (ADMIN ONLY)
   * Get specific user details
   */
  async findById(id: string, adminRole: UserRole) {
    if (adminRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only Admin can view user details');
    }

    const { data, error } = await this.supabaseAdmin
      .from('users')
      .select('id, email, name, role, is_active, created_at')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException('User not found');
    }

    return {
      ...data,
      createdAt: data.created_at,
    };
  }

  /**
   * UPDATE USER (ADMIN ONLY)
   * Update user details
   * Cannot change Admin role
   */
  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    adminRole: UserRole,
  ) {
    if (adminRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only Admin can update users');
    }

    // Prevent creating new Admins
    if (updateUserDto.role === UserRole.ADMIN) {
      throw new BadRequestException(
        'Cannot assign Admin role. Admin role is only available through registration.',
      );
    }

    // Verify user exists
    const { data: existingUser } = await this.supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('id', id)
      .single();

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // Cannot change Admin to other role
    if (existingUser.role === UserRole.ADMIN && updateUserDto.role) {
      throw new BadRequestException('Cannot change Admin user role');
    }

    const { data, error } = await this.supabaseAdmin
      .from('users')
      .update({
        ...updateUserDto,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to update user: ${error.message}`);
    }

    // Update auth metadata if role changed
    if (updateUserDto.role) {
      try {
        await this.supabaseAdmin.auth.admin.updateUserById(id, {
          user_metadata: {
            role: updateUserDto.role,
          },
        });
      } catch (err) {
        console.warn('Failed to update auth metadata:', err);
      }
    }

    return data;
  }

  /**
   * DEACTIVATE USER (ADMIN ONLY)
   * Soft delete - set is_active to false
   */
  async remove(id: string, adminRole: UserRole) {
    if (adminRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only Admin can deactivate users');
    }

    // Verify user exists
    const existingUser = await this.findById(id, adminRole);
    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    const { data, error } = await this.supabaseAdmin
      .from('users')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to deactivate user: ${error.message}`);
    }

    return {
      ...data,
      message: 'User deactivated successfully',
    };
  }
}
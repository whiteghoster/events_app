import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AuditService } from '../audit/audit.service';
import { UserRole, AuditAction } from '../common/types';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly auditService: AuditService,
  ) {}

  private get supabase() {
    return this.databaseService.getClient();
  }

  async create(createUserDto: CreateUserDto, adminRole: UserRole, actorId: string) {
    if (adminRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only Admin can create users');
    }

    if (createUserDto.role === UserRole.ADMIN) {
      throw new BadRequestException('Cannot create Admin users. Use registration instead.');
    }

    const { data: existingUser } = await this.supabase
      .from('users')
      .select('id')
      .eq('email', createUserDto.email)
      .maybeSingle();

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    const displayName = createUserDto.name || createUserDto.email.split('@')[0];

    const { data: authData, error: authError } = await this.supabase.auth.admin.createUser({
      email: createUserDto.email,
      password: createUserDto.password,
      email_confirm: true,
      user_metadata: { role: createUserDto.role, name: displayName },
    });

    if (authError) {
      throw new BadRequestException(`Failed to create auth user: ${authError.message}`);
    }

    const { data: user, error: userError } = await this.supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: createUserDto.email,
        name: displayName,
        role: createUserDto.role,
        is_active: true,
      })
      .select('id, email, name, role, is_active, created_at')
      .single();

    if (userError) {
      await this.supabase.auth.admin.deleteUser(authData.user.id);
      throw new BadRequestException(`Failed to create user record: ${userError.message}`);
    }

    await this.auditService.createLog({
      entity_type: 'User',
      entity_id: user.id,
      action: AuditAction.CREATE,
      user_id: actorId,
      new_values: user,
    });

    return user;
  }

  async findAll(adminRole: UserRole, page: number = 1, pageSize: number = 20) {
    if (adminRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only Admin can view all users');
    }

    const offset = Math.max(0, (page - 1) * pageSize);

    const { data, count, error } = await this.supabase
      .from('users')
      .select('id, email, name, role, is_active, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) {
      throw new BadRequestException(`Failed to fetch users: ${error.message}`);
    }

    return {
      data: data ?? [],
      total: count ?? 0,
      page,
      pageSize,
      totalPages: Math.ceil((count ?? 0) / pageSize),
    };
  }

  async findById(id: string, adminRole: UserRole) {
    if (adminRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only Admin can view user details');
    }

    const { data, error } = await this.supabase
      .from('users')
      .select('id, email, name, role, is_active, created_at')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException('User not found');
    }

    return data;
  }

  async update(id: string, updateUserDto: UpdateUserDto, adminRole: UserRole, actorId: string) {
    if (adminRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only Admin can update users');
    }

    if (updateUserDto.role === UserRole.ADMIN) {
      throw new BadRequestException('Cannot assign Admin role. Use registration instead.');
    }

    const { data: existingUser } = await this.supabase
      .from('users')
      .select('id, role')
      .eq('id', id)
      .single();

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    if (existingUser.role === UserRole.ADMIN && updateUserDto.role) {
      throw new BadRequestException('Cannot change Admin user role');
    }

    const { data, error } = await this.supabase
      .from('users')
      .update({ ...updateUserDto, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to update user: ${error.message}`);
    }

    await this.auditService.createLog({
      entity_type: 'User',
      entity_id: id,
      action: AuditAction.UPDATE,
      user_id: actorId,
      old_values: existingUser,
      new_values: data,
    });

    if (updateUserDto.role) {
      const { error: metaError } = await this.supabase.auth.admin.updateUserById(id, {
        user_metadata: { role: updateUserDto.role },
      });
      if (metaError) {
        this.logger.warn(`Failed to sync auth metadata for user ${id}: ${metaError.message}`);
      }
    }

    return data;
  }

  async remove(id: string, adminRole: UserRole, actorId: string) {
    if (adminRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only Admin can deactivate users');
    }

    const existingUser = await this.findById(id, adminRole);

    const { data, error } = await this.supabase
      .from('users')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to deactivate user: ${error.message}`);
    }

    await this.auditService.createLog({
      entity_type: 'User',
      entity_id: id,
      action: AuditAction.DELETE,
      user_id: actorId,
      old_values: existingUser,
      new_values: data,
    });

    return { ...data, message: 'User deactivated successfully' };
  }

  async activate(id: string, adminRole: UserRole, actorId: string) {
    if (adminRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only Admin can activate users');
    }

    const { data, error } = await this.supabase
      .from('users')
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to activate user: ${error.message}`);
    }

    return { ...data, message: 'User activated successfully' };
  }

  async hardDelete(id: string, adminRole: UserRole, actorId: string) {
    if (adminRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only Admin can delete users permanently');
    }

    if (id === actorId) {
      throw new BadRequestException('Cannot permanently delete your own account');
    }

    const { error: authError } = await this.supabase.auth.admin.deleteUser(id);
    if (authError) {
      this.logger.warn(`Auth delete failed for user ${id}: ${authError.message}`);
    }

    const { error: dbError } = await this.supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (dbError) {
      throw new BadRequestException(`Failed to delete user from database: ${dbError.message}`);
    }

    await this.auditService.createLog({
      entity_type: 'User',
      entity_id: id,
      action: AuditAction.DELETE,
      user_id: actorId,
    });

    return { message: 'User permanently deleted' };
  }
}

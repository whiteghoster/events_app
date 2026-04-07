import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { UserRole } from '../auth/enums/user-role.enum';

export class CreateUserDto {
  email: string;
  role: UserRole;
}

export class UpdateUserDto {
  email?: string;
  role?: UserRole;
}

@Injectable()
export class UsersService {
  constructor(private databaseService: DatabaseService) { }

  async create(createUserDto: CreateUserDto) {
    const supabase = this.databaseService.getClient();

    // First create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: createUserDto.email,
      password: Math.random().toString(36).substring(2), // Random password
      email_confirm: true,
    });

    if (authError) {
      throw new Error(`Failed to create auth user: ${authError.message}`);
    }

    // Then create user record in our users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: createUserDto.email,
        role: createUserDto.role,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (userError) {
      // Rollback auth user creation
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw new Error(`Failed to create user record: ${userError.message}`);
    }

    return user;
  }

  async findAll() {
    const supabase = this.databaseService.getClient();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }

    return data;
  }

  async findById(id: string) {
    const supabase = this.databaseService.getClient();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch user: ${error.message}`);
    }

    return data;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const supabase = this.databaseService.getClient();
    const { data, error } = await supabase
      .from('users')
      .update(updateUserDto)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }

    return data;
  }

  async remove(id: string) {
    const supabase = this.databaseService.getClient();

    const user = await this.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    const { data, error } = await supabase
      .from('users')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to deactivate user: ${error.message}`);
    }

    // Optional: also block auth login if you want
    // await supabase.auth.admin.updateUserById(id, { ban_duration: '876000h' });

    return data;
  }
}

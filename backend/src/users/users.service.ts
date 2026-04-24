import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AuditService } from '../audit/audit.service';
import { UserRole, AuditAction } from '../common/types';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { paginate, paginationOffset } from '../common/utils';

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

  async create(createUserDto: CreateUserDto, actorId: string) {
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
      this.supabase.auth.admin.deleteUser(authData.user.id).catch(err => {
        this.logger.error(`Orphaned auth user ${authData.user.id}: cleanup failed: ${err.message}`);
      });
      throw new BadRequestException(`Failed to create user record: ${userError.message}`);
    }

    this.auditService.createLog({
      entity_type: 'User',
      entity_id: user.id,
      action: AuditAction.CREATE,
      user_id: actorId,
      new_values: user,
    });

    return user;
  }

  async findAll(page: number = 1, pageSize: number = 20) {
    const offset = paginationOffset(page, pageSize);

    const { data, count, error } = await this.supabase
      .from('users')
      .select('id, email, name, role, is_active, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) throw new BadRequestException(`Failed to fetch users: ${error.message}`);
    return paginate(data, count, page, pageSize);
  }

  async findById(id: string) {
    const { data, error } = await this.supabase
      .from('users')
      .select('id, email, name, role, is_active, created_at')
      .eq('id', id)
      .single();

    if (error || !data) throw new NotFoundException('User not found');
    return data;
  }

  async update(id: string, updateUserDto: UpdateUserDto, actorId: string) {
    const existingUser = await this.findById(id);

    if (existingUser.role === UserRole.ADMIN && updateUserDto.role) {
      throw new BadRequestException('Cannot change Admin user role');
    }

    const { data, error } = await this.supabase
      .from('users')
      .update({ ...updateUserDto, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new BadRequestException(`Failed to update user: ${error.message}`);

    this.auditService.createLog({
      entity_type: 'User',
      entity_id: id,
      action: AuditAction.UPDATE,
      user_id: actorId,
      old_values: existingUser,
      new_values: data,
    });

    if (updateUserDto.role) {
      this.supabase.auth.admin.updateUserById(id, {
        user_metadata: { role: updateUserDto.role },
      }).catch(err => {
        this.logger.warn(`Failed to sync auth metadata for user ${id}: ${err.message}`);
      });
    }

    return data;
  }

  async remove(id: string, actorId: string, permanent: boolean = false) {
    if (permanent) return this.hardDelete(id, actorId);
    return this.softDelete(id, actorId);
  }

  private async softDelete(id: string, actorId: string) {
    const { data, error } = await this.supabase
      .from('users')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new BadRequestException(`Failed to deactivate user: ${error.message}`);

    this.auditService.createLog({
      entity_type: 'User',
      entity_id: id,
      action: AuditAction.DELETE,
      user_id: actorId,
      new_values: data,
    });

    return data;
  }

  private async hardDelete(id: string, actorId: string) {
    if (id === actorId) {
      throw new BadRequestException('Cannot permanently delete your own account');
    }

    this.supabase.auth.admin.deleteUser(id).catch(err => {
      this.logger.warn(`Auth delete failed for user ${id}: ${err.message}`);
    });

    const { error } = await this.supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) throw new BadRequestException(`Failed to delete user from database: ${error.message}`);

    this.auditService.createLog({
      entity_type: 'User',
      entity_id: id,
      action: AuditAction.DELETE,
      user_id: actorId,
    });
  }
}

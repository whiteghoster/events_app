import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../enums/user-role.enum';

/**
 * Roles Decorator
 * Specifies which roles are allowed to access this endpoint
 *
 * Usage:
 * @Roles(UserRole.ADMIN, UserRole.STAFF)
 * @Post('create')
 * async create() { }
 */
export const ROLES_KEY = 'roles';

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
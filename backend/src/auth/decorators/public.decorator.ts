import { SetMetadata } from '@nestjs/common';

/**
 * Public Decorator
 * Marks endpoint as publicly accessible (no authentication required)
 *
 * Usage:
 * @Public()
 * @Post('login')
 * async login() { }
 */
export const IS_PUBLIC_KEY = 'isPublic';

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
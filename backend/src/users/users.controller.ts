import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Delete,
  Param,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  async create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.usersService.create(createUserDto, user.role, user.id);
    return { success: true, data, message: 'User created successfully' };
  }

  @Get()
  @Roles(UserRole.ADMIN)
  async findAll(
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const result = await this.usersService.findAll(
      user.role,
      parseInt(page, 10),
      parseInt(pageSize, 10),
    );
    return { success: true, ...result };
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  async findById(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    const data = await this.usersService.findById(id, user.role);
    return { success: true, data };
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.usersService.update(id, updateUserDto, user.role, user.id);
    return { success: true, data, message: 'User updated successfully' };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    const data = await this.usersService.remove(id, user.role, user.id);
    return { success: true, data, message: 'User deactivated successfully' };
  }

  @Post(':id/activate')
  @Roles(UserRole.ADMIN)
  async activate(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    const data = await this.usersService.activate(id, user.role, user.id);
    return { success: true, data, message: 'User activated successfully' };
  }

  @Delete(':id/permanent')
  @Roles(UserRole.ADMIN)
  async permanentDelete(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    await this.usersService.hardDelete(id, user.role, user.id);
    return { success: true, message: 'User permanently deleted from system' };
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Delete,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  async create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.usersService.create(createUserDto, user.id);
    return { success: true, data, message: 'User created successfully' };
  }

  @Get()
  @Roles(UserRole.ADMIN)
  async findAll(@Query() pagination: PaginationQueryDto) {
    const result = await this.usersService.findAll(pagination.page, pagination.pageSize);
    return { success: true, ...result };
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.usersService.findById(id);
    return { success: true, data };
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.usersService.update(id, updateUserDto, user.id);
    return { success: true, data, message: 'User updated successfully' };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async deactivate(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    const data = await this.usersService.deactivate(id, user.id);
    return { success: true, data, message: 'User deactivated successfully' };
  }

  @Post(':id/activate')
  @Roles(UserRole.ADMIN)
  async activate(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    const data = await this.usersService.activate(id, user.id);
    return { success: true, data, message: 'User activated successfully' };
  }

  @Delete(':id/permanent')
  @Roles(UserRole.ADMIN)
  async permanentDelete(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    await this.usersService.hardDelete(id, user.id);
    return { success: true, message: 'User permanently deleted from system' };
  }
}

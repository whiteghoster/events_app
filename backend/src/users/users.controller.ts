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
import { UsersService, CreateUserDto, UpdateUserDto } from './users.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) { }

  /**
   * CREATE USER
   * Admin only - can create Staff and Staff Member users
   */
  @Post()
  @Roles(UserRole.ADMIN)
  async create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() user: any,
  ) {
    const newUser = await this.usersService.create(createUserDto, user.role);
    return {
      success: true,
      data: newUser,
      message: 'User created successfully',
    };
  }

  /**
   * LIST ALL USERS
   * Admin only - with pagination
   */
  @Get()
  @Roles(UserRole.ADMIN)
  async findAll(
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
    @CurrentUser() user: any,
  ) {
    const result = await this.usersService.findAll(
      user.role,
      parseInt(page, 10),
      parseInt(pageSize, 10),
    );
    return {
      success: true,
      ...result,
    };
  }

  /**
   * GET USER BY ID
   * Admin only
   */
  @Get(':id')
  @Roles(UserRole.ADMIN)
  async findById(@Param('id') id: string, @CurrentUser() user: any) {
    const userData = await this.usersService.findById(id, user.role);
    return {
      success: true,
      data: userData,
    };
  }

  /**
   * UPDATE USER
   * Admin only - cannot change Admin role
   */
  @Put(':id')
  @Roles(UserRole.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: any,
  ) {
    const updatedUser = await this.usersService.update(
      id,
      updateUserDto,
      user.role,
    );
    return {
      success: true,
      data: updatedUser,
      message: 'User updated successfully',
    };
  }

  /**
   * DEACTIVATE USER
   * Admin only - soft delete
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    const result = await this.usersService.remove(id, user.role);
    return {
      success: true,
      data: result,
      message: 'User deactivated successfully',
    };
  }

  /**
   * ACTIVATE USER
   * Admin only
   */
  @Post(':id/activate')
  @Roles(UserRole.ADMIN)
  async activate(@Param('id') id: string, @CurrentUser() user: any) {
    const result = await this.usersService.activate(id, user.role);
    return {
      success: true,
      data: result,
      message: 'User activated successfully',
    };
  }

  /**
   * PERMANENT DELETE
   * Admin only
   */
  @Delete(':id/permanent')
  @Roles(UserRole.ADMIN)
  async permanentDelete(@Param('id') id: string, @CurrentUser() user: any) {
    await this.usersService.hardDelete(id, user.role);
    return {
      success: true,
      message: 'User permanently deleted from system',
    };
  }
}
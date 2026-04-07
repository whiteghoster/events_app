import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Put, 
  Delete, 
  Param, 
  HttpException, 
  HttpStatus,
  Query,
} from '@nestjs/common';
import { UsersService, CreateUserDto, UpdateUserDto } from './users.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  async create(@Body() createUserDto: CreateUserDto) {
    try {
      return {
        success: true,
        data: await this.usersService.create(createUserDto),
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create user',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get()
  @Roles(UserRole.ADMIN)
  async findAll() {
    try {
      return {
        success: true,
        data: await this.usersService.findAll(),
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch users',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  async findById(@Param('id') id: string) {
    try {
      const user = await this.usersService.findById(id);
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      return {
        success: true,
        data: user,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch user',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    try {
      const user = await this.usersService.update(id, updateUserDto);
      return {
        success: true,
        data: user,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to update user',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string) {
    try {
      await this.usersService.remove(id);
      return {
        success: true,
        message: 'User deleted successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to delete user',
        HttpStatus.BAD_REQUEST
      );
    }
  }
}

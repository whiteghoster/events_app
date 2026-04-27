import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly catalogService: CatalogService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.KARIGAR, UserRole.MANAGER)
  async create(@Body() dto: CreateCategoryDto, @CurrentUser() user: AuthenticatedUser) {
    const data = await this.catalogService.createCategory(dto, user.id);
    return { data };
  }

  @Get()
  async findAll(@Query() pagination: PaginationQueryDto) {
    return await this.catalogService.findAllCategories(pagination.page, pagination.page_size);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.KARIGAR, UserRole.MANAGER)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.catalogService.updateCategory(id, dto, user.id);
    return { data };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.KARIGAR, UserRole.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    await this.catalogService.deleteCategory(id, user.id);
  }
}

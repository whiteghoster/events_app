import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Post('categories')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async createCategory(@Body() dto: CreateCategoryDto, @CurrentUser() user: AuthenticatedUser) {
    const data = await this.catalogService.createCategory(dto, user.id);
    return { success: true, data };
  }

  @Get('categories')
  async findAllCategories(@Query() pagination: PaginationQueryDto) {
    const result = await this.catalogService.findAllCategories(pagination.page, pagination.pageSize);
    return { success: true, ...result };
  }

  @Get('categories/:id')
  async findCategoryById(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.catalogService.findCategoryById(id);
    return { success: true, data };
  }

  @Put('categories/:id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async updateCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.catalogService.updateCategory(id, dto, user.id);
    return { success: true, data };
  }

  @Delete('categories/:id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async deleteCategory(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    await this.catalogService.deleteCategory(id, user.id);
    return { success: true, message: 'Category deleted successfully' };
  }

  @Post('products')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async createProduct(@Body() dto: CreateProductDto, @CurrentUser() user: AuthenticatedUser) {
    const data = await this.catalogService.createProduct(dto, user.id);
    return { success: true, data };
  }

  @Get('products')
  async findAllProducts(@Query() pagination: PaginationQueryDto) {
    const result = await this.catalogService.findAllProducts(pagination.page, pagination.pageSize);
    return { success: true, ...result };
  }

  @Get('products/category/:categoryId')
  async findProductsByCategory(
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Query() pagination: PaginationQueryDto,
  ) {
    const result = await this.catalogService.findProductsByCategory(
      categoryId,
      pagination.page,
      pagination.pageSize,
    );
    return { success: true, ...result };
  }

  @Get('products/:id')
  async findProductById(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.catalogService.findProductById(id);
    return { success: true, data };
  }

  @Put('products/:id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async updateProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.catalogService.updateProduct(id, dto, user.id);
    return { success: true, data };
  }

  @Post('products/:id/deactivate')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async deactivateProduct(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    const data = await this.catalogService.deactivateProduct(id, user.id);
    return { success: true, data, message: 'Product deactivated successfully' };
  }

  @Delete('products/:id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async deleteProduct(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    await this.catalogService.deleteProduct(id, user.id);
    return { success: true, message: 'Product deleted successfully' };
  }

  @Post('seed/categories')
  @Roles(UserRole.ADMIN)
  async seedCategories() {
    const result = await this.catalogService.seedCategories();
    return { success: true, message: result.message };
  }

  @Post('seed/products')
  @Roles(UserRole.ADMIN)
  async seedProducts() {
    const result = await this.catalogService.seedProducts();
    return { success: true, message: result.message };
  }
}

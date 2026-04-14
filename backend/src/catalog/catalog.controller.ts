import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('catalog')
export class CatalogController {
  constructor(private catalogService: CatalogService) { }

  // ========== CATEGORIES ==========

  @Post('categories')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async createCategory(@Body() createCategoryDto: CreateCategoryDto, @CurrentUser() user: any) {
    return {
      success: true,
      data: await this.catalogService.createCategory(createCategoryDto, user.id),
    };
  }

  @Get('categories')
  async findAllCategories(
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
  ) {
    const result = await this.catalogService.findAllCategories(
      parseInt(page, 10),
      parseInt(pageSize, 10),
    );
    return {
      success: true,
      ...result,
    };
  }

  @Get('categories/:id')
  async findCategoryById(@Param('id') id: string) {
    return {
      success: true,
      data: await this.catalogService.findCategoryById(id),
    };
  }

  @Put('categories/:id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async updateCategory(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @CurrentUser() user: any,
  ) {
    return {
      success: true,
      data: await this.catalogService.updateCategory(id, updateCategoryDto, user.id),
    };
  }

  @Delete('categories/:id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async deleteCategory(@Param('id') id: string, @CurrentUser() user: any) {
    await this.catalogService.deleteCategory(id, user.id);
    return {
      success: true,
      message: 'Category deleted successfully',
    };
  }

  // ========== PRODUCTS ==========

  @Post('products')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async createProduct(@Body() createProductDto: CreateProductDto, @CurrentUser() user: any) {
    return {
      success: true,
      data: await this.catalogService.createProduct(createProductDto, user.id),
    };
  }

  @Get('products')
  async findAllProducts(
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
  ) {
    const result = await this.catalogService.findAllProducts(
      parseInt(page, 10),
      parseInt(pageSize, 10),
    );
    return {
      success: true,
      ...result,
    };
  }

  @Get('products/category/:categoryId')
  async findProductsByCategory(
    @Param('categoryId') categoryId: string,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
  ) {
    const result = await this.catalogService.findProductsByCategory(
      categoryId,
      parseInt(page, 10),
      parseInt(pageSize, 10),
    );
    return {
      success: true,
      ...result,
    };
  }

  @Get('products/:id')
  async findProductById(@Param('id') id: string) {
    return {
      success: true,
      data: await this.catalogService.findProductById(id),
    };
  }

  @Put('products/:id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async updateProduct(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @CurrentUser() user: any,
  ) {
    return {
      success: true,
      data: await this.catalogService.updateProduct(id, updateProductDto, user.id),
    };
  }

  @Post('products/:id/deactivate')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async deactivateProduct(@Param('id') id: string, @CurrentUser() user: any) {
    return {
      success: true,
      data: await this.catalogService.deactivateProduct(id, user.id),
      message: 'Product deactivated successfully',
    };
  }

  @Delete('products/:id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async deleteProduct(@Param('id') id: string, @CurrentUser() user: any) {
    await this.catalogService.deleteProduct(id, user.id);
    return {
      success: true,
      message: 'Product deleted successfully',
    };
  }

  // ========== SEED ENDPOINTS ==========

  @Post('seed/categories')
  @Roles(UserRole.ADMIN)
  async seedCategories() {
    await this.catalogService.seedCategories();
    return {
      success: true,
      message: 'Categories seeded successfully',
    };
  }

  @Post('seed/products')
  @Roles(UserRole.ADMIN)
  async seedProducts() {
    await this.catalogService.seedProducts();
    return {
      success: true,
      message: 'Products seeded successfully',
    };
  }
}
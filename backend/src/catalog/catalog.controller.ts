import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query,
  ConflictException,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
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
  constructor(private catalogService: CatalogService) {}

  // CATEGORIES
  @Post('categories')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async createCategory(@Body() createCategoryDto: CreateCategoryDto, @CurrentUser() user: any) {
    const data = await this.catalogService.createCategory(createCategoryDto, user.sub || user.id);
    return { success: true, data };
  }

  @Get('categories')
  async findAllCategories() {
    const data = await this.catalogService.findAllCategories();
    return { success: true, data };
  }

  @Get('categories/:id')
  async findCategoryById(@Param('id') id: string) {
    const category = await this.catalogService.findCategoryById(id);
    return { success: true, data: category };
  }

  @Put('categories/:id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async updateCategory(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto, @CurrentUser() user: any) {
    const category = await this.catalogService.updateCategory(id, updateCategoryDto, user.sub || user.id);
    return { success: true, data: category };
  }

  @Delete('categories/:id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async deleteCategory(@Param('id') id: string, @CurrentUser() user: any) {
    await this.catalogService.deleteCategory(id, user.sub || user.id);
    return { success: true, message: 'Category deleted successfully' };
  }

  // PRODUCTS
  @Post('products')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async createProduct(@Body() createProductDto: CreateProductDto, @CurrentUser() user: any) {
    const data = await this.catalogService.createProduct(createProductDto, user.sub || user.id);
    return { success: true, data };
  }

  @Get('products')
  async findAllProducts(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : undefined;
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    const data = await this.catalogService.findAllProducts(pageNum, limitNum);
    return { success: true, ...data };
  }

  @Get('products/category/:categoryId')
  async findProductsByCategory(@Param('categoryId') categoryId: string) {
    const data = await this.catalogService.findProductsByCategory(categoryId);
    return { success: true, data };
  }

  @Get('products/:id')
  async findProductById(@Param('id') id: string) {
    const product = await this.catalogService.findProductById(id);
    return { success: true, data: product };
  }

  @Put('products/:id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async updateProduct(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto, @CurrentUser() user: any) {
    const product = await this.catalogService.updateProduct(id, updateProductDto, user.sub || user.id);
    return { success: true, data: product };
  }

  @Post('products/:id/deactivate')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async deactivateProduct(@Param('id') id: string, @CurrentUser() user: any) {
    const product = await this.catalogService.deactivateProduct(id, user.sub || user.id);
    return { success: true, data: product, message: 'Product deactivated successfully' };
  }

  @Delete('products/:id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async deleteProduct(@Param('id') id: string, @CurrentUser() user: any) {
    await this.catalogService.deleteProduct(id, user.sub || user.id);
    return { success: true, message: 'Product deleted successfully' };
  }

  // SEED ENDPOINTS
  @Post('seed/categories')
  @Roles(UserRole.ADMIN)
  async seedCategories(@CurrentUser() user: any) {
    await this.catalogService.seedCategories(user.sub || user.id);
    return { success: true, message: 'Categories seeded successfully' };
  }

  @Post('seed/products')
  @Roles(UserRole.ADMIN)
  async seedProducts(@CurrentUser() user: any) {
    await this.catalogService.seedProducts(user.sub || user.id);
    return { success: true, message: 'Products seeded successfully' };
  }
}

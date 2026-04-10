import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  HttpException, 
  HttpStatus,
  Query,
  ConflictException,
} from '@nestjs/common';
import {
  CatalogService,
} from './catalog.service';
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
  async createCategory(@Body() createCategoryDto: CreateCategoryDto) {
    try {
      return {
        success: true,
        data: await this.catalogService.createCategory(createCategoryDto),
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw new HttpException(error.message, HttpStatus.CONFLICT);
      }
      throw new HttpException(
        error.message || 'Failed to create category',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('categories')
  async findAllCategories() {
    try {
      return {
        success: true,
        data: await this.catalogService.findAllCategories(),
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch categories',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('categories/:id')
  async findCategoryById(@Param('id') id: string) {
    try {
      const category = await this.catalogService.findCategoryById(id);
      if (!category) {
        throw new HttpException('Category not found', HttpStatus.NOT_FOUND);
      }
      return {
        success: true,
        data: category,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch category',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('categories/:id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async updateCategory(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    try {
      const category = await this.catalogService.updateCategory(
        id,
        updateCategoryDto,
      );
      return {
        success: true,
        data: category,
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw new HttpException(error.message, HttpStatus.CONFLICT);
      }
      throw new HttpException(
        error.message || 'Failed to update category',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete('categories/:id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async deleteCategory(@Param('id') id: string) {
    try {
      await this.catalogService.deleteCategory(id);
      return {
        success: true,
        message: 'Category deleted successfully',
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw new HttpException(error.message, HttpStatus.CONFLICT);
      }
      throw new HttpException(
        error.message || 'Failed to delete category',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // PRODUCTS
  @Post('products')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async createProduct(@Body() createProductDto: CreateProductDto) {
    try {
      return {
        success: true,
        data: await this.catalogService.createProduct(createProductDto),
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw new HttpException(error.message, HttpStatus.CONFLICT);
      }
      throw new HttpException(
        error.message || 'Failed to create product',
        HttpStatus.BAD_REQUEST,
      );
    }
  }


  @Get('products')
  async findAllProducts() {
    try {
      return {
        success: true,
        data: await this.catalogService.findAllProducts(),
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch products',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('products/category/:categoryId')
  async findProductsByCategory(@Param('categoryId') categoryId: string) {
    try {
      return {
        success: true,
        data: await this.catalogService.findProductsByCategory(categoryId),
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch products',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('products/:id')
  async findProductById(@Param('id') id: string) {
    try {
      const product = await this.catalogService.findProductById(id);
      if (!product) {
        throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
      }
      return {
        success: true,
        data: product,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch product',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put('products/:id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async updateProduct(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    try {
      const product = await this.catalogService.updateProduct(id, updateProductDto);
      return {
        success: true,
        data: product,
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw new HttpException(error.message, HttpStatus.CONFLICT);
      }
      throw new HttpException(
        error.message || 'Failed to update product',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post('products/:id/deactivate')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async deactivateProduct(@Param('id') id: string) {
    try {
      const product = await this.catalogService.deactivateProduct(id);
      return {
        success: true,
        data: product,
        message: 'Product deactivated successfully',
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw new HttpException(error.message, HttpStatus.CONFLICT);
      }
      throw new HttpException(
        error.message || 'Failed to deactivate product',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Delete('products/:id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async deleteProduct(@Param('id') id: string) {
    try {
      await this.catalogService.deleteProduct(id);
      return {
        success: true,
        message: 'Product deleted successfully',
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw new HttpException(error.message, HttpStatus.CONFLICT);
      }
      throw new HttpException(
        error.message || 'Failed to delete product',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // SEED ENDPOINTS
  @Post('seed/categories')
  @Roles(UserRole.ADMIN)
  async seedCategories() {
    try {
      await this.catalogService.seedCategories();
      return {
        success: true,
        message: 'Categories seeded successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to seed categories',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('seed/products')
  @Roles(UserRole.ADMIN)
  async seedProducts() {
    try {
      await this.catalogService.seedProducts();
      return {
        success: true,
        message: 'Products seeded successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to seed products',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}

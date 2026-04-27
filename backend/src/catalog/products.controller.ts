import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly catalogService: CatalogService) { }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.KARIGAR, UserRole.MANAGER)
  async create(@Body() dto: CreateProductDto, @CurrentUser() user: AuthenticatedUser) {
    const data = await this.catalogService.createProduct(dto, user.id);
    return { data };
  }

  @Get()
  async findAll(
    @Query() pagination: PaginationQueryDto,
  ) {
    return await this.catalogService.findAllProducts(
      pagination.page,
      pagination.page_size,
      pagination.category_id,
    );
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.KARIGAR, UserRole.MANAGER)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.catalogService.updateProduct(id, dto, user.id);
    return { data };
  }
}

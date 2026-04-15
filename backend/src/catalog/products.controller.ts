import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types';
import { FindProductsQueryDto } from './dto/find-products-query.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly catalogService: CatalogService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async create(@Body() dto: CreateProductDto, @CurrentUser() user: AuthenticatedUser) {
    const data = await this.catalogService.createProduct(dto, user.id);
    return { data };
  }

  @Get()
  async findAll(@Query() query: FindProductsQueryDto) {
    return await this.catalogService.findAllProducts(
      query.page,
      query.page_size,
      query.category_id,
    );
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.catalogService.updateProduct(id, dto, user.id);
    return { data };
  }

  @Post('seed')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async seed() {
    await this.catalogService.seedProducts();
    return { data: { seeded: true } };
  }
}

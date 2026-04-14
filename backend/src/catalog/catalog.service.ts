import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AuditService } from '../audit/audit.service';
import { EventStatus, AuditAction } from '../common/types';
import { paginate, paginationOffset } from '../common/utils';

@Injectable()
export class CatalogService {
  private readonly logger = new Logger(CatalogService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly auditService: AuditService,
  ) {}

  private get supabase() {
    return this.databaseService.getClient();
  }

  // CATEGORIES

  async createCategory(createCategoryDto: CreateCategoryDto, actorId: string) {
    const { data, error } = await this.supabase
      .from('categories')
      .insert({ name: createCategoryDto.name })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new ConflictException('Category with this name already exists');
      }
      throw new BadRequestException(`Failed to create category: ${error.message}`);
    }

    await this.auditService.createLog({
      entity_type: 'Category',
      entity_id: data.id,
      action: AuditAction.CREATE,
      user_id: actorId,
      new_values: data,
    });

    return data;
  }

  async findAllCategories(page: number = 1, pageSize: number = 20) {
    const offset = paginationOffset(page, pageSize);

    const { data, count, error } = await this.supabase
      .from('categories')
      .select('*', { count: 'exact' })
      .order('name', { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (error) {
      throw new BadRequestException(`Failed to fetch categories: ${error.message}`);
    }

    return paginate(data, count, page, pageSize);
  }

  async findCategoryById(id: string) {
    const { data, error } = await this.supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException('Category not found');
    }

    return data;
  }

  async updateCategory(id: string, updateCategoryDto: UpdateCategoryDto, actorId: string) {
    const oldCategory = await this.findCategoryById(id);

    const { data, error } = await this.supabase
      .from('categories')
      .update(updateCategoryDto)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new ConflictException('Category with this name already exists');
      }
      throw new BadRequestException(`Failed to update category: ${error.message}`);
    }

    await this.auditService.createLog({
      entity_type: 'Category',
      entity_id: id,
      action: AuditAction.UPDATE,
      user_id: actorId,
      old_values: oldCategory,
      new_values: data,
    });

    return data;
  }

  async deleteCategory(id: string, actorId: string) {
    const category = await this.findCategoryById(id);

    const { count, error: countError } = await this.supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', id)
      .eq('is_active', true);

    if (countError) {
      throw new BadRequestException(`Failed to validate category deletion: ${countError.message}`);
    }

    if ((count || 0) > 0) {
      throw new ConflictException(
        `Cannot delete category. ${count} active product(s) still exist in this category.`,
      );
    }

    const { error } = await this.supabase.from('categories').delete().eq('id', id);

    if (error) {
      throw new BadRequestException(`Failed to delete category: ${error.message}`);
    }

    await this.auditService.createLog({
      entity_type: 'Category',
      entity_id: id,
      action: AuditAction.DELETE,
      user_id: actorId,
      old_values: category,
    });

    return { message: 'Category deleted successfully' };
  }

  // PRODUCTS

  async createProduct(createProductDto: CreateProductDto, actorId: string) {
    await this.findCategoryById(createProductDto.category_id);

    const { data, error } = await this.supabase
      .from('products')
      .insert({
        name: createProductDto.name,
        category_id: createProductDto.category_id,
        default_unit: createProductDto.default_unit,
        price: createProductDto.price ?? null,
        description: createProductDto.description ?? null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new ConflictException('Product with this name already exists in this category');
      }
      throw new BadRequestException(`Failed to create product: ${error.message}`);
    }

    await this.auditService.createLog({
      entity_type: 'Product',
      entity_id: data.id,
      action: AuditAction.CREATE,
      user_id: actorId,
      new_values: data,
    });

    return data;
  }

  async findAllProducts(page: number = 1, pageSize: number = 20) {
    const offset = paginationOffset(page, pageSize);

    const { data, count, error } = await this.supabase
      .from('products')
      .select(`*, category:categories(id, name)`, { count: 'exact' })
      .eq('is_active', true)
      .order('name', { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (error) {
      throw new BadRequestException(`Failed to fetch products: ${error.message}`);
    }

    return paginate(data, count, page, pageSize);
  }

  async findProductsByCategory(categoryId: string, page: number = 1, pageSize: number = 20) {
    await this.findCategoryById(categoryId);

    const offset = paginationOffset(page, pageSize);

    const { data, count, error } = await this.supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .order('name', { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (error) {
      throw new BadRequestException(`Failed to fetch products: ${error.message}`);
    }

    return paginate(data, count, page, pageSize);
  }

  async findProductById(id: string) {
    const { data, error } = await this.supabase
      .from('products')
      .select(`*, category:categories(id, name)`)
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException('Product not found');
    }

    return data;
  }

  async updateProduct(id: string, updateProductDto: UpdateProductDto, actorId: string) {
    const oldProduct = await this.findProductById(id);

    if (updateProductDto.category_id) {
      await this.findCategoryById(updateProductDto.category_id);
    }

    const { data, error } = await this.supabase
      .from('products')
      .update(updateProductDto)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new ConflictException('Product with this name already exists in this category');
      }
      throw new BadRequestException(`Failed to update product: ${error.message}`);
    }

    await this.auditService.createLog({
      entity_type: 'Product',
      entity_id: id,
      action: AuditAction.UPDATE,
      user_id: actorId,
      old_values: oldProduct,
      new_values: data,
    });

    return data;
  }

  async deactivateProduct(id: string, actorId: string) {
    const oldProduct = await this.findProductById(id);

    const { data: linkedRows, error: linkedRowsError } = await this.supabase
      .from('event_products')
      .select(`id, event:events(id, status)`)
      .eq('product_id', id);

    if (linkedRowsError) {
      throw new BadRequestException(`Failed to validate product deactivation: ${linkedRowsError.message}`);
    }

    const inLiveEvent = (linkedRows || []).some(
      (row: any) => row.event?.status === EventStatus.LIVE,
    );

    if (inLiveEvent) {
      throw new ConflictException('Cannot deactivate product because it is currently used in a live event.');
    }

    const { data, error } = await this.supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to deactivate product: ${error.message}`);
    }

    await this.auditService.createLog({
      entity_type: 'Product',
      entity_id: id,
      action: AuditAction.UPDATE,
      user_id: actorId,
      old_values: oldProduct,
      new_values: data,
    });

    return data;
  }

  async deleteProduct(id: string, actorId: string) {
    const product = await this.findProductById(id);

    const { count, error: countError } = await this.supabase
      .from('event_products')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', id);

    if (countError) {
      throw new BadRequestException(`Failed to check event products: ${countError.message}`);
    }

    if ((count || 0) > 0) {
      throw new ConflictException('Cannot delete product that is currently assigned to events');
    }

    const { error } = await this.supabase.from('products').delete().eq('id', id);

    if (error) {
      throw new BadRequestException(`Failed to delete product: ${error.message}`);
    }

    await this.auditService.createLog({
      entity_type: 'Product',
      entity_id: id,
      action: AuditAction.DELETE,
      user_id: actorId,
      old_values: product,
    });

    return { message: 'Product deleted successfully' };
  }

  // SEED DATA

  async seedCategories() {
    const categories = ['Flowers', 'Foliage', 'Vases', 'Ribbons', 'Lighting', 'Decorations'];

    const { error } = await this.supabase
      .from('categories')
      .upsert(
        categories.map((name) => ({ name })),
        { onConflict: 'name' },
      );

    if (error) {
      throw new BadRequestException(`Failed to seed categories: ${error.message}`);
    }

    return { message: 'Categories seeded successfully' };
  }

  async seedProducts() {
    const { data: categories, error: catError } = await this.supabase
      .from('categories')
      .select('id, name');

    if (catError || !categories?.length) {
      throw new BadRequestException('Seed categories first before seeding products');
    }

    const categoryMap = new Map(categories.map((c) => [c.name, c.id]));

    const products = [
      { name: 'Roses', category: 'Flowers', unit: 'bunch', price: 500 },
      { name: 'Lilies', category: 'Flowers', unit: 'bunch', price: 400 },
      { name: 'Tulips', category: 'Flowers', unit: 'bunch', price: 350 },
      { name: 'Orchids', category: 'Flowers', unit: 'stem', price: 800 },
      { name: 'Carnations', category: 'Flowers', unit: 'bunch', price: 250 },
      { name: 'Eucalyptus', category: 'Foliage', unit: 'bunch', price: 150 },
      { name: 'Ferns', category: 'Foliage', unit: 'bunch', price: 120 },
      { name: 'Palm Leaves', category: 'Foliage', unit: 'kg', price: 200 },
      { name: 'Ruscus', category: 'Foliage', unit: 'bunch', price: 180 },
      { name: 'Glass Cylinder', category: 'Vases', unit: 'pcs', price: 1500 },
      { name: 'Ceramic Urn', category: 'Vases', unit: 'pcs', price: 2000 },
      { name: 'Crystal Bowl', category: 'Vases', unit: 'pcs', price: 3500 },
      { name: 'Metal Stand', category: 'Vases', unit: 'pcs', price: 800 },
      { name: 'Satin Ribbon', category: 'Ribbons', unit: 'metre', price: 50 },
      { name: 'Velvet Ribbon', category: 'Ribbons', unit: 'metre', price: 80 },
      { name: 'Organza Ribbon', category: 'Ribbons', unit: 'metre', price: 60 },
      { name: 'Grosgrain Ribbon', category: 'Ribbons', unit: 'metre', price: 100 },
      { name: 'LED Spotlights', category: 'Lighting', unit: 'set', price: 1200 },
      { name: 'Fairy Lights', category: 'Lighting', unit: 'metre', price: 200 },
      { name: 'Uplights', category: 'Lighting', unit: 'set', price: 800 },
      { name: 'Pin Spots', category: 'Lighting', unit: 'set', price: 600 },
      { name: 'Floral Foam', category: 'Decorations', unit: 'kg', price: 300 },
      { name: 'Moss Mats', category: 'Decorations', unit: 'pcs', price: 400 },
      { name: 'Decorative Stones', category: 'Decorations', unit: 'kg', price: 500 },
      { name: 'Artificial Butterflies', category: 'Decorations', unit: 'dozen', price: 200 },
    ];

    const rows = products
      .filter((p) => categoryMap.has(p.category))
      .map((p) => ({
        name: p.name,
        category_id: categoryMap.get(p.category),
        default_unit: p.unit,
        price: p.price,
        is_active: true,
      }));

    const { error } = await this.supabase
      .from('products')
      .upsert(rows, { onConflict: 'name,category_id' });

    if (error) {
      throw new BadRequestException(`Failed to seed products: ${error.message}`);
    }

    return { message: `${rows.length} products seeded successfully` };
  }
}

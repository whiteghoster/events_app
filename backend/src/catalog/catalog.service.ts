import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { EventStatus } from '../auth/enums/event-status.enum';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../auth/enums/audit-action.enum';

@Injectable()
export class CatalogService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly auditService: AuditService,
  ) { }

  private get supabase() {
    return this.databaseService.getClient();
  }

  // ===========================
  // CATEGORIES
  // ===========================

  async createCategory(createCategoryDto: CreateCategoryDto, actorId: string) {
    const { data, error } = await this.supabase
      .from('categories')
      .insert({
        name: createCategoryDto.name,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new ConflictException('Category with this name already exists');
      }
      throw new BadRequestException(`Failed to create category: ${error.message}`);
    }

    // Audit Log
    await this.auditService.createLog({
      entity_type: 'Category',
      entity_id: data.id,
      action: AuditAction.CREATED,
      user_id: actorId,
      new_values: data,
    });

    return data;
  }

  async findAllCategories(page: number = 1, pageSize: number = 20) {
    const offset = Math.max(0, (page - 1) * pageSize);

    const { data, count, error } = await this.supabase
      .from('categories')
      .select('*', { count: 'exact' })
      .order('name', { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (error) {
      throw new BadRequestException(`Failed to fetch categories: ${error.message}`);
    }

    return {
      data: data ?? [],
      total: count ?? 0,
      page,
      pageSize,
      totalPages: Math.ceil((count ?? 0) / pageSize),
    };
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

    if (error) {
      throw new BadRequestException(`Failed to fetch category: ${error.message}`);
    }

    return data;
  }

  async updateCategory(id: string, updateCategoryDto: UpdateCategoryDto, actorId: string) {
    // Verify category exists
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

    // Audit Log
    await this.auditService.createLog({
      entity_type: 'Category',
      entity_id: id,
      action: AuditAction.UPDATED,
      user_id: actorId,
      old_values: oldCategory,
      new_values: data,
    });

    return data;
  }

  async deleteCategory(id: string, actorId: string) {
    // Verify category exists
    const category = await this.findCategoryById(id);

    // Check for active products in this category
    const { count, error: countError } = await this.supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', id)
      .eq('is_active', true);

    if (countError) {
      throw new BadRequestException(
        `Failed to validate category deletion: ${countError.message}`
      );
    }

    if ((count || 0) > 0) {
      throw new ConflictException(
        `Cannot delete category. ${count} active product(s) still exist in this category.`
      );
    }

    const { error } = await this.supabase.from('categories').delete().eq('id', id);

    if (error) {
      throw new BadRequestException(`Failed to delete category: ${error.message}`);
    }

    // Audit Log
    await this.auditService.createLog({
      entity_type: 'Category',
      entity_id: id,
      action: AuditAction.DELETED,
      user_id: actorId,
      old_values: category,
    });

    return { message: 'Category deleted successfully' };
  }

  // ===========================
  // PRODUCTS
  // ===========================

  async createProduct(createProductDto: CreateProductDto, actorId: string) {
    // Verify category exists
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
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new ConflictException('Product with this name already exists in this category');
      }
      throw new BadRequestException(`Failed to create product: ${error.message}`);
    }

    // Audit Log
    await this.auditService.createLog({
      entity_type: 'Product',
      entity_id: data.id,
      action: AuditAction.CREATED,
      user_id: actorId,
      new_values: data,
    });

    return data;
  }

  async findAllProducts(page: number = 1, pageSize: number = 20) {
    const offset = Math.max(0, (page - 1) * pageSize);

    const { data, count, error } = await this.supabase
      .from('products')
      .select(
        `
        *,
        category:categories(id, name)
      `,
        { count: 'exact' }
      )
      .eq('is_active', true)
      .order('name', { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (error) {
      throw new BadRequestException(`Failed to fetch products: ${error.message}`);
    }

    return {
      data: data ?? [],
      total: count ?? 0,
      page,
      pageSize,
      totalPages: Math.ceil((count ?? 0) / pageSize),
    };
  }

  async findProductsByCategory(categoryId: string, page: number = 1, pageSize: number = 20) {
    // Verify category exists
    await this.findCategoryById(categoryId);

    const offset = Math.max(0, (page - 1) * pageSize);

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

    return {
      data: data ?? [],
      total: count ?? 0,
      page,
      pageSize,
      totalPages: Math.ceil((count ?? 0) / pageSize),
    };
  }

  async findProductById(id: string) {
    const { data, error } = await this.supabase
      .from('products')
      .select(
        `
        *,
        category:categories(id, name)
      `
      )
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException('Product not found');
    }

    if (error) {
      throw new BadRequestException(`Failed to fetch product: ${error.message}`);
    }

    return data;
  }

  async updateProduct(id: string, updateProductDto: UpdateProductDto, actorId: string) {
    // Verify product exists
    const oldProduct = await this.findProductById(id);

    // If category_id is being updated, verify new category exists
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

    // Audit Log
    await this.auditService.createLog({
      entity_type: 'Product',
      entity_id: id,
      action: AuditAction.UPDATED,
      user_id: actorId,
      old_values: oldProduct,
      new_values: data,
    });

    return data;
  }

  async deactivateProduct(id: string, actorId: string) {
    // Verify product exists
    const oldProduct = await this.findProductById(id);

    // Check if product is used in any live events
    const { data: linkedRows, error: linkedRowsError } = await this.supabase
      .from('event_products')
      .select(
        `
        id,
        event:events(id, status)
      `
      )
      .eq('product_id', id);

    if (linkedRowsError) {
      throw new BadRequestException(
        `Failed to validate product deactivation: ${linkedRowsError.message}`
      );
    }

    // Use Enum instead of hardcoded string
    const inLiveEvent = (linkedRows || []).some(
      (row: any) => row.event?.status === EventStatus.LIVE
    );

    if (inLiveEvent) {
      throw new ConflictException(
        'Cannot deactivate product because it is currently used in a live event.'
      );
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

    // Audit Log
    await this.auditService.createLog({
      entity_type: 'Product',
      entity_id: id,
      action: 'DEACTIVATED',
      user_id: actorId,
      old_values: oldProduct,
      new_values: data,
    });

    return data;
  }

  async deleteProduct(id: string, actorId: string) {
    // Verify product exists
    const product = await this.findProductById(id);

    // Check if product is in any events
    const { count, error: countError } = await this.supabase
      .from('event_products')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', id);

    if (countError) {
      throw new BadRequestException(
        `Failed to check event products: ${countError.message}`
      );
    }

    if ((count || 0) > 0) {
      throw new ConflictException(
        'Cannot delete product that is currently assigned to events'
      );
    }

    const { error } = await this.supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      throw new BadRequestException(`Failed to delete product: ${error.message}`);
    }

    // Audit Log
    await this.auditService.createLog({
      entity_type: 'Product',
      entity_id: id,
      action: AuditAction.DELETED,
      user_id: actorId,
      old_values: product,
    });

    return { message: 'Product deleted successfully' };
  }

  // ===========================
  // SEED DATA
  // ===========================

  async seedCategories() {
    const categories = [
      { name: 'Flowers' },
      { name: 'Foliage' },
      { name: 'Vases' },
      { name: 'Ribbons' },
      { name: 'Lighting' },
      { name: 'Decorations' },
    ];

    for (const category of categories) {
      const { error } = await this.supabase
        .from('categories')
        .upsert({ name: category.name }, { onConflict: 'name' });

      if (error) {
        console.error(`Failed to seed category ${category.name}:`, error);
      }
    }

    return { message: 'Categories seeded successfully' };
  }

  async seedProducts() {
    const products = [
      // Flowers
      { name: 'Roses', category_name: 'Flowers', default_unit: 'bunch', price: 500 },
      { name: 'Lilies', category_name: 'Flowers', default_unit: 'bunch', price: 400 },
      { name: 'Tulips', category_name: 'Flowers', default_unit: 'bunch', price: 350 },
      { name: 'Orchids', category_name: 'Flowers', default_unit: 'stem', price: 800 },
      { name: 'Carnations', category_name: 'Flowers', default_unit: 'bunch', price: 250 },

      // Foliage
      { name: 'Eucalyptus', category_name: 'Foliage', default_unit: 'bunch', price: 150 },
      { name: 'Ferns', category_name: 'Foliage', default_unit: 'bunch', price: 120 },
      { name: 'Palm Leaves', category_name: 'Foliage', default_unit: 'kg', price: 200 },
      { name: 'Ruscus', category_name: 'Foliage', default_unit: 'bunch', price: 180 },

      // Vases
      { name: 'Glass Cylinder', category_name: 'Vases', default_unit: 'pcs', price: 1500 },
      { name: 'Ceramic Urn', category_name: 'Vases', default_unit: 'pcs', price: 2000 },
      { name: 'Crystal Bowl', category_name: 'Vases', default_unit: 'pcs', price: 3500 },
      { name: 'Metal Stand', category_name: 'Vases', default_unit: 'pcs', price: 800 },

      // Ribbons
      { name: 'Satin Ribbon', category_name: 'Ribbons', default_unit: 'metre', price: 50 },
      { name: 'Velvet Ribbon', category_name: 'Ribbons', default_unit: 'metre', price: 80 },
      { name: 'Organza Ribbon', category_name: 'Ribbons', default_unit: 'metre', price: 60 },
      { name: 'Grosgrain Ribbon', category_name: 'Ribbons', default_unit: 'metre', price: 100 },

      // Lighting
      { name: 'LED Spotlights', category_name: 'Lighting', default_unit: 'set', price: 1200 },
      { name: 'Fairy Lights', category_name: 'Lighting', default_unit: 'metre', price: 200 },
      { name: 'Uplights', category_name: 'Lighting', default_unit: 'set', price: 800 },
      { name: 'Pin Spots', category_name: 'Lighting', default_unit: 'set', price: 600 },

      // Decorations
      { name: 'Floral Foam', category_name: 'Decorations', default_unit: 'kg', price: 300 },
      { name: 'Moss Mats', category_name: 'Decorations', default_unit: 'pcs', price: 400 },
      { name: 'Decorative Stones', category_name: 'Decorations', default_unit: 'kg', price: 500 },
      { name: 'Artificial Butterflies', category_name: 'Decorations', default_unit: 'dozen', price: 200 },
    ];

    for (const product of products) {
      // Get category ID by name
      const { data: category } = await this.supabase
        .from('categories')
        .select('id')
        .eq('name', product.category_name)
        .single();

      if (!category) {
        console.error(`Category ${product.category_name} not found for product ${product.name}`);
        continue;
      }

      const { error } = await this.supabase
        .from('products')
        .upsert(
          {
            name: product.name,
            category_id: category.id,
            default_unit: product.default_unit,
            price: product.price,
            is_active: true,
          },
          { onConflict: 'name,category_id' }
        );

      if (error) {
        console.error(`Failed to seed product ${product.name}:`, error);
      }
    }

    return { message: 'Products seeded successfully' };
  }
}
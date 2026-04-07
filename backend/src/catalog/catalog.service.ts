import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';

export class CreateCategoryDto {
  name: string;
}

export class UpdateCategoryDto {
  name?: string;
}

export class CreateProductDto {
  name: string;
  category_id: string;
  default_unit: string;
  price?: number;
  description?: string;
}

export class UpdateProductDto {
  name?: string;
  category_id?: string;
  default_unit?: string;
  price?: number;
  description?: string;
  is_active?: boolean;
}

@Injectable()
export class CatalogService {
  constructor(private databaseService: DatabaseService) {}

  // CATEGORIES
  async createCategory(createCategoryDto: CreateCategoryDto, userId: string) {
    const supabase = this.databaseService.getClient();
    
    await this.databaseService.setUserId(userId);
    
    const { data, error } = await supabase
      .from('categories')
      .insert({
        name: createCategoryDto.name,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    await this.databaseService.clearUserId();

    if (error) {
      if (error.code === '23505') { // Unique violation
        throw new ConflictException('Category name already exists');
      }
      throw new Error(`Failed to create category: ${error.message}`);
    }

    return data;
  }

  async findAllCategories() {
    const supabase = this.databaseService.getClient();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }

    return data;
  }

  async findCategoryById(id: string) {
    const supabase = this.databaseService.getClient();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch category: ${error.message}`);
    }

    return data;
  }

  async updateCategory(id: string, updateCategoryDto: UpdateCategoryDto, userId: string) {
    const supabase = this.databaseService.getClient();
    
    await this.databaseService.setUserId(userId);
    
    const { data, error } = await supabase
      .from('categories')
      .update(updateCategoryDto)
      .eq('id', id)
      .select()
      .single();

    await this.databaseService.clearUserId();

    if (error) {
      if (error.code === '23505') { // Unique violation
        throw new ConflictException('Category name already exists');
      }
      throw new Error(`Failed to update category: ${error.message}`);
    }

    return data;
  }

 async deleteCategory(id: string, userId: string) {
  const supabase = this.databaseService.getClient();

  const { count, error: countError } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', id)
    .eq('is_active', true);

  if (countError) {
    throw new Error(`Failed to validate category deletion: ${countError.message}`);
  }

  if ((count || 0) > 0) {
    throw new ConflictException(
      `Cannot delete category. ${count} active product(s) still exist in this category.`,
    );
  }

  const { error } = await supabase.from('categories').delete().eq('id', id);

  if (error) {
    throw new Error(`Failed to delete category: ${error.message}`);
  }

  return true;
}
  // PRODUCTS
  async createProduct(createProductDto: CreateProductDto, userId: string) {
    const supabase = this.databaseService.getClient();
    
    await this.databaseService.setUserId(userId);
    
    const { data, error } = await supabase
      .from('products')
      .insert({
        name: createProductDto.name,
        category_id: createProductDto.category_id,
        default_unit: createProductDto.default_unit,
        price: createProductDto.price || null,
        description: createProductDto.description || null,
        is_active: true,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    await this.databaseService.clearUserId();

    if (error) {
      if (error.code === '23505') { // Unique violation
        throw new ConflictException('Product name already exists in this category');
      }
      throw new Error(`Failed to create product: ${error.message}`);
    }

    return data;
  }

  async findAllProducts() {
    const supabase = this.databaseService.getClient();
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories (
          id,
          name
        )
      `)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch products: ${error.message}`);
    }

    return data;
  }

  async findProductsByCategory(categoryId: string) {
    const supabase = this.databaseService.getClient();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch products: ${error.message}`);
    }

    return data;
  }

  async findProductById(id: string) {
    const supabase = this.databaseService.getClient();
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories (
          id,
          name
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch product: ${error.message}`);
    }

    return data;
  }

  async updateProduct(id: string, updateProductDto: UpdateProductDto, userId: string) {
    const supabase = this.databaseService.getClient();
    
    await this.databaseService.setUserId(userId);
    
    const { data, error } = await supabase
      .from('products')
      .update(updateProductDto)
      .eq('id', id)
      .select()
      .single();

    await this.databaseService.clearUserId();

    if (error) {
      if (error.code === '23505') { // Unique violation
        throw new ConflictException('Product name already exists in this category');
      }
      throw new Error(`Failed to update product: ${error.message}`);
    }

    return data;
  }

  async deactivateProduct(id: string, userId: string) {
  const supabase = this.databaseService.getClient();

  const { data: linkedRows, error: linkedRowsError } = await supabase
    .from('event_products')
    .select(`
      id,
      event:events (
        id,
        status
      )
    `)
    .eq('product_id', id);

  if (linkedRowsError) {
    throw new Error(`Failed to validate product deactivation: ${linkedRowsError.message}`);
  }

  const inLiveEvent = (linkedRows || []).some(
    (row: any) => row.event?.status === 'live',
  );

  if (inLiveEvent) {
    throw new ConflictException(
      'Cannot deactivate product because it is currently used in a live event.',
    );
  }

  const { data, error } = await supabase
    .from('products')
    .update({ is_active: false })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to deactivate product: ${error.message}`);
  }

  return data;
}

  async deleteProduct(id: string, userId: string) {
    const supabase = this.databaseService.getClient();
    
    // Check if product is in any live events
    const { data: eventProducts, error: eventError } = await supabase
      .from('event_products')
      .select('id')
      .eq('product_id', id);

    if (eventError) {
      throw new Error(`Failed to check event products: ${eventError.message}`);
    }

    if (eventProducts && eventProducts.length > 0) {
      throw new ConflictException('Cannot delete product that is currently assigned to live events');
    }

    await this.databaseService.setUserId(userId);

    // Delete the product
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    await this.databaseService.clearUserId();

    if (error) {
      throw new Error(`Failed to delete product: ${error.message}`);
    }

    return true;
  }

  // SEED DATA
  async seedCategories(userId: string) {
    const categories = [
      { name: 'Flowers' },
      { name: 'Foliage' },
      { name: 'Vases' },
      { name: 'Ribbons' },
      { name: 'Lighting' },
      { name: 'Decorations' },
    ];

    const supabase = this.databaseService.getClient();
    
    await this.databaseService.setUserId(userId);
    
    for (const category of categories) {
      const { error } = await supabase
        .from('categories')
        .upsert({ name: category.name }, { onConflict: 'name' });

      if (error) {
        console.error(`Failed to seed category ${category.name}:`, error);
      }
    }
    
    await this.databaseService.clearUserId();
  }

  async seedProducts(userId: string) {
    const products = [
      // Flowers
      { name: 'Roses', category_id: 'flowers-category-id', default_unit: 'bunch', price: 500 },
      { name: 'Lilies', category_id: 'flowers-category-id', default_unit: 'bunch', price: 400 },
      { name: 'Tulips', category_id: 'flowers-category-id', default_unit: 'bunch', price: 350 },
      { name: 'Orchids', category_id: 'flowers-category-id', default_unit: 'stem', price: 800 },
      { name: 'Carnations', category_id: 'flowers-category-id', default_unit: 'bunch', price: 250 },
      
      // Foliage
      { name: 'Eucalyptus', category_id: 'foliage-category-id', default_unit: 'bunch', price: 150 },
      { name: 'Ferns', category_id: 'foliage-category-id', default_unit: 'bunch', price: 120 },
      { name: 'Palm Leaves', category_id: 'foliage-category-id', default_unit: 'kg', price: 200 },
      { name: 'Ruscus', category_id: 'foliage-category-id', default_unit: 'bunch', price: 180 },
      
      // Vases
      { name: 'Glass Cylinder', category_id: 'vases-category-id', default_unit: 'pcs', price: 1500 },
      { name: 'Ceramic Urn', category_id: 'vases-category-id', default_unit: 'pcs', price: 2000 },
      { name: 'Crystal Bowl', category_id: 'vases-category-id', default_unit: 'pcs', price: 3500 },
      { name: 'Metal Stand', category_id: 'vases-category-id', default_unit: 'pcs', price: 800 },
      
      // Ribbons
      { name: 'Satin Ribbon', category_id: 'ribbons-category-id', default_unit: 'metre', price: 50 },
      { name: 'Velvet Ribbon', category_id: 'ribbons-category-id', default_unit: 'metre', price: 80 },
      { name: 'Organza Ribbon', category_id: 'ribbons-category-id', default_unit: 'metre', price: 60 },
      { name: 'Grosgrain Ribbon', category_id: 'ribbons-category-id', default_unit: 'metre', price: 100 },
      
      // Lighting
      { name: 'LED Spotlights', category_id: 'lighting-category-id', default_unit: 'set', price: 1200 },
      { name: 'Fairy Lights', category_id: 'lighting-category-id', default_unit: 'metre', price: 200 },
      { name: 'Uplights', category_id: 'lighting-category-id', default_unit: 'set', price: 800 },
      { name: 'Pin Spots', category_id: 'lighting-category-id', default_unit: 'set', price: 600 },
      
      // Decorations
      { name: 'Floral Foam', category_id: 'decorations-category-id', default_unit: 'kg', price: 300 },
      { name: 'Moss Mats', category_id: 'decorations-category-id', default_unit: 'pcs', price: 400 },
      { name: 'Decorative Stones', category_id: 'decorations-category-id', default_unit: 'kg', price: 500 },
      { name: 'Artificial Butterflies', category_id: 'decorations-category-id', default_unit: 'dozen', price: 200 },
    ];

    const supabase = this.databaseService.getClient();
    
    await this.databaseService.setUserId(userId);
    
    for (const product of products) {
      const { error } = await supabase
        .from('products')
        .upsert({
          name: product.name,
          category_id: product.category_id,
          default_unit: product.default_unit,
          price: product.price,
          is_active: true,
        }, { onConflict: 'name,category_id' });

      if (error) {
        console.error(`Failed to seed product ${product.name}:`, error);
      }
    }
    
    await this.databaseService.clearUserId();
  }
}

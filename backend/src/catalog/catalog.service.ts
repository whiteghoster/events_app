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
import { paginate, paginationOffset } from '../common/utils';

@Injectable()
export class CatalogService {
  constructor(
    private readonly databaseService: DatabaseService,
  ) {}

  private get supabase() {
    return this.databaseService.getClient();
  }

  // ── Categories ──

  async createCategory(createCategoryDto: CreateCategoryDto, actorId: string) {
    const { data, error } = await this.supabase
      .from('categories')
      .insert({ name: createCategoryDto.name })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') throw new ConflictException('Category with this name already exists');
      throw new BadRequestException(`Failed to create category: ${error.message}`);
    }

    return data;
  }

  async findAllCategories(page: number = 1, pageSize: number = 20) {
    const offset = paginationOffset(page, pageSize);

    const { data, count, error } = await this.supabase
      .from('categories')
      .select('id, name', { count: 'exact' })
      .order('name', { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (error) throw new BadRequestException(`Failed to fetch categories: ${error.message}`);
    return paginate(data, count, page, pageSize);
  }

  async findCategoryById(id: string) {
    const { data, error } = await this.supabase
      .from('categories')
      .select('id, name')
      .eq('id', id)
      .single();

    if (error || !data) throw new NotFoundException('Category not found');
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
      if (error.code === '23505') throw new ConflictException('Category with this name already exists');
      throw new BadRequestException(`Failed to update category: ${error.message}`);
    }

    return data;
  }

  async deleteCategory(id: string, actorId: string) {
    const category = await this.findCategoryById(id);

    // Atomic: check product count + delete in single transaction
    const { error } = await this.supabase.rpc('delete_category_safe', { p_category_id: id });

    if (error) {
      if (error.message?.includes('not found')) throw new NotFoundException('Category not found');
      if (error.message?.includes('Cannot delete')) throw new ConflictException(error.message);
      throw new BadRequestException(`Failed to delete category: ${error.message}`);
    }

  }

  // ── Products ──

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
      if (error.code === '23505') throw new ConflictException('Product with this name already exists in this category');
      throw new BadRequestException(`Failed to create product: ${error.message}`);
    }

    return data;
  }

  async findAllProducts(page: number = 1, pageSize: number = 20, categoryId?: string) {
    const offset = paginationOffset(page, pageSize);

    let query = this.supabase
      .from('products')
      .select(`id, name, category_id, default_unit, price, is_active, category:categories(id, name)`, { count: 'exact' })
      .order('name', { ascending: true });

    if (categoryId) query = query.eq('category_id', categoryId);

    const { data, count, error } = await query.range(offset, offset + pageSize - 1);

    if (error) throw new BadRequestException(`Failed to fetch products: ${error.message}`);
    return paginate(data, count, page, pageSize);
  }

  async findProductById(id: string) {
    const { data, error } = await this.supabase
      .from('products')
      .select(`id, name, category_id, default_unit, price, is_active, category:categories(id, name)`)
      .eq('id', id)
      .single();

    if (error || !data) throw new NotFoundException('Product not found');
    return data;
  }

  async updateProduct(id: string, updateProductDto: UpdateProductDto, actorId: string) {
    const oldProduct = await this.findProductById(id);

    if (updateProductDto.category_id) {
      await this.findCategoryById(updateProductDto.category_id);
    }

    // Atomic deactivation: check live events + deactivate in single transaction
    if (updateProductDto.is_active === false) {
      const { data, error } = await this.supabase.rpc('deactivate_product_safe', { p_product_id: id });

      if (error) {
        if (error.message?.includes('Cannot deactivate')) throw new ConflictException(error.message);
        if (error.message?.includes('not found')) throw new NotFoundException('Product not found');
        throw new BadRequestException(`Failed to deactivate product: ${error.message}`);
      }

      return data;
    }

    const { data, error } = await this.supabase
      .from('products')
      .update(updateProductDto)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') throw new ConflictException('Product with this name already exists in this category');
      throw new BadRequestException(`Failed to update product: ${error.message}`);
    }

    return data;
  }

  // ── Seed Data ──

  private assertNonProduction() {
    if (process.env.NODE_ENV === 'production') {
      throw new BadRequestException('Seed operations are disabled in production');
    }
  }

  async seedCategories() {
    this.assertNonProduction();
    const categories = ['Flowers', 'Foliage', 'Vases', 'Ribbons', 'Lighting', 'Decorations'];

    const { error } = await this.supabase
      .from('categories')
      .upsert(
        categories.map((name) => ({ name })),
        { onConflict: 'name' },
      );

    if (error) throw new BadRequestException(`Failed to seed categories: ${error.message}`);
  }

  async seedProducts() {
    this.assertNonProduction();
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

    if (error) throw new BadRequestException(`Failed to seed products: ${error.message}`);
  }
}

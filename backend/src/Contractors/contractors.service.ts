import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateContractorDto } from './dto/create-contractor.dto';
import { UpdateContractorDto } from './dto/update-contractor.dto';

// Helper to transform snake_case to camelCase
function transformContractor(data: any) {
  if (!data) return null;
  return {
    id: data.id,
    name: data.name,
    isActive: data.is_active,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

@Injectable()
export class ContractorsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll() {
    const supabase = this.databaseService.getClient();
    const { data, error } = await supabase
      .from('contractors')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return (data || []).map(transformContractor);
  }

  async create(dto: CreateContractorDto) {
    console.log('[ContractorsService] Creating contractor:', dto);
    const supabase = this.databaseService.getClient();
    const { data, error } = await supabase
      .from('contractors')
      .insert({
        name: dto.name,
        is_active: dto.isActive ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error('[ContractorsService] Create error:', error);
      throw error;
    }
    console.log('[ContractorsService] Created:', data);
    return transformContractor(data);
  }

  async update(id: string, dto: UpdateContractorDto) {
    console.log('[ContractorsService] Update called:', { id, dto });
    const supabase = this.databaseService.getClient();
    
    // Check if exists
    const { data: existing, error: checkError } = await supabase
      .from('contractors')
      .select('id')
      .eq('id', id)
      .single();
    
    console.log('[ContractorsService] Check existing:', { existing, checkError });
    
    if (!existing) {
      throw new NotFoundException(`Contractor with ID ${id} not found`);
    }

    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.isActive !== undefined) updateData.is_active = dto.isActive;
    updateData.updated_at = new Date().toISOString();
    
    console.log('[ContractorsService] Updating with:', updateData);

    const { data, error } = await supabase
      .from('contractors')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    console.log('[ContractorsService] Update result:', { data, error });
    
    if (error) throw error;
    return transformContractor(data);
  }

  async delete(id: string) {
    const supabase = this.databaseService.getClient();
    
    // Check if exists
    const { data: existing } = await supabase
      .from('contractors')
      .select('id')
      .eq('id', id)
      .single();
    
    if (!existing) {
      throw new NotFoundException(`Contractor with ID ${id} not found`);
    }

    const { error } = await supabase
      .from('contractors')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  }
}

import { IsString, IsNotEmpty, IsEnum, IsOptional, IsDateString, IsUUID } from 'class-validator';
import { OccasionType } from '../../common/types';

export class CreateEventDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(OccasionType)
  @IsOptional()
  occasion_type?: OccasionType;

  @IsDateString()
  @IsNotEmpty()
  event_date: string;

  @IsString()
  @IsNotEmpty()
  client_name: string;

  @IsString()
  @IsOptional()
  company_name?: string;

  @IsString()
  @IsOptional()
  contact_phone?: string;

  @IsString()
  @IsNotEmpty()
  venue: string;

  @IsString()
  @IsOptional()
  venue_address?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  head_karigar_name?: string;

  @IsString()
  @IsOptional()
  manager_name?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsDateString()
  @IsOptional()
  delivery_from_date?: string;

  @IsDateString()
  @IsOptional()
  delivery_to_date?: string;

  @IsUUID()
  @IsOptional()
  assigned_to?: string;
}
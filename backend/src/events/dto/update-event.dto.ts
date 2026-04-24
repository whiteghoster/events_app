import { IsString, IsOptional, IsEnum, IsDateString, IsUUID } from 'class-validator';
import { OccasionType, EventStatus } from '../../common/types';

export class UpdateEventDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(OccasionType)
  @IsOptional()
  occasion_type?: OccasionType;

  @IsDateString()
  @IsOptional()
  event_date?: string;

  @IsString()
  @IsOptional()
  client_name?: string;

  @IsString()
  @IsOptional()
  company_name?: string;

  @IsString()
  @IsOptional()
  contact_phone?: string;

  @IsString()
  @IsOptional()
  venue?: string;

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

  @IsEnum(EventStatus)
  @IsOptional()
  status?: EventStatus;

  @IsString()
  @IsOptional()
  display_id?: string;
}
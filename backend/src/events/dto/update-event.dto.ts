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
  date?: string;

  @IsString()
  @IsOptional()
  venue_name?: string;

  @IsString()
  @IsOptional()
  venue_address?: string;

  @IsString()
  @IsOptional()
  contact_person?: string;

  @IsString()
  @IsOptional()
  contact_phone?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsUUID()
  @IsOptional()
  assigned_to?: string;

  @IsEnum(EventStatus)
  @IsOptional()
  status?: EventStatus;
}
import { IsString, IsNotEmpty, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { OccasionType } from '../../auth/enums/occasion-type.enum';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(OccasionType)
  @IsNotEmpty()
  occasion_type: OccasionType;

  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsNotEmpty()
  venue_name: string;

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
}
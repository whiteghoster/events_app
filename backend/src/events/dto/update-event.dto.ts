import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { OccasionType } from '../../auth/enums/occasion-type.enum';
import { EventStatus } from '../../auth/enums/event-status.enum';

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

  @IsEnum(EventStatus)
  @IsOptional()
  status?: EventStatus;
}
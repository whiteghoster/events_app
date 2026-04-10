import { IsString, IsOptional, IsEnum, IsDateString, IsNotEmpty, MaxLength } from 'class-validator';
import { OccasionType } from '../../auth/enums/occasion-type.enum';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsEnum(OccasionType)
  occasionType?: OccasionType;

  @IsOptional()
  @IsEnum(OccasionType)
  occasion_type?: OccasionType;

  @IsOptional()
  @IsDateString()
  eventDate?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  venueName?: string;

  @IsOptional()
  @IsString()
  venue_name?: string;

  @IsOptional()
  @IsString()
  venueAddress?: string;

  @IsOptional()
  @IsString()
  venue_address?: string;

  @IsOptional()
  @IsString()
  contactName?: string;

  @IsOptional()
  @IsString()
  contact_person?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  contact_phone?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

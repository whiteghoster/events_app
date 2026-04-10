import { IsString, IsOptional, IsNumber, IsUUID, IsBoolean, Min, MaxLength } from 'class-validator';

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  @MaxLength(150)
  name?: string;

  @IsUUID()
  @IsOptional()
  category_id?: string;

  @IsString()
  @IsOptional()
  default_unit?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  price?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

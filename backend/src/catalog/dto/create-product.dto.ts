import { IsString, IsNotEmpty, IsOptional, IsNumber, IsUUID, Min, MaxLength } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @IsUUID()
  category_id: string;

  @IsString()
  @IsNotEmpty()
  default_unit: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  price?: number;

  @IsString()
  @IsOptional()
  description?: string;
}

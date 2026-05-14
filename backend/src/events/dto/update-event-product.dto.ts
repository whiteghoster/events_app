import { IsNumber, IsString, IsOptional, Min, IsUUID } from 'class-validator';

export class UpdateEventProductDto {
  @IsUUID()
  @IsOptional()
  product_id?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  quantity?: number;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  price?: number;
}
import { IsNumber, IsString, IsOptional, Min } from 'class-validator';

export class UpdateEventProductDto {
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
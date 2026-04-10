import { IsNumber, IsString, IsOptional, Min } from 'class-validator';

export class UpdateEventProductDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;
}

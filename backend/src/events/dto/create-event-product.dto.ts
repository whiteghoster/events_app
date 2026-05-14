import { IsUUID, IsNumber, IsString, IsNotEmpty, IsOptional, Min } from 'class-validator';

export class CreateEventProductDto {
  @IsUUID()
  @IsOptional()
  event_id?: string;

  @IsUUID()
  @IsNotEmpty()
  product_id: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsString()
  @IsNotEmpty()
  unit: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  price?: number;
}
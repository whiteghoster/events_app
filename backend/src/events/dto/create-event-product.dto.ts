import { IsUUID, IsNumber, IsString, IsOptional, Min, IsNotEmpty } from 'class-validator';

export class CreateEventProductDto {
  @IsUUID()
  event_id: string;

  @IsUUID()
  product_id: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsString()
  @IsNotEmpty()
  unit: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;
}

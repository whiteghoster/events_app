import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateCategoryDto {
  @IsOptional()
  @IsString({ message: 'Category name must be a string' })
  @MaxLength(100, { message: 'Category name must not exceed 100 characters' })
  name?: string;
}
import { IsOptional, IsString, IsNumber, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { AuditAction } from '../../common/types';

export class FindAuditLogsDto {
  @IsOptional()
  @IsString()
  entity_type?: string;

  @IsOptional()
  @IsString()
  entity_id?: string;

  @IsOptional()
  @IsEnum(AuditAction)
  action?: AuditAction;

  @IsOptional()
  @IsString()
  user_id?: string;

  @IsOptional()
  @IsString()
  date_from?: string;

  @IsOptional()
  @IsString()
  date_to?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  format?: string;
}

import { IsUUID, IsOptional, IsString, IsInt, Min, IsIn, IsDateString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class EventContractorEntryDto {
  @IsUUID()
  contractor_id: string;

  @IsOptional()
  @IsString()
  @IsIn(['day', 'night'])
  shift?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  member_quantity?: number;

  @IsOptional()
  @IsDateString()
  work_date?: string;
}

export class AddEventContractorDto extends EventContractorEntryDto {}

export class SyncEventContractorsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventContractorEntryDto)
  contractors: EventContractorEntryDto[];

  @IsOptional()
  @IsDateString()
  workFrom?: string;

  @IsOptional()
  @IsDateString()
  workTo?: string;
}

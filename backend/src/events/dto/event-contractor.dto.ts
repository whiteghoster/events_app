import { IsUUID, IsOptional, IsString, IsInt, Min, IsIn } from 'class-validator';

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
}

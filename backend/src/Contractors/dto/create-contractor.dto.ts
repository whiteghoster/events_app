import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateContractorDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

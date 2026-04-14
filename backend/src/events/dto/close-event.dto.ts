import { IsEnum, IsNotEmpty } from 'class-validator';
import { EventStatus } from '../../common/types';

export class CloseEventDto {
  @IsEnum(EventStatus)
  @IsNotEmpty()
  status: EventStatus;
}
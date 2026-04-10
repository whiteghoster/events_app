import { IsEnum, IsNotEmpty } from 'class-validator';
import { EventStatus } from '../../auth/enums/event-status.enum';

export class CloseEventDto {
  @IsEnum(EventStatus)
  @IsNotEmpty()
  status: EventStatus;
}
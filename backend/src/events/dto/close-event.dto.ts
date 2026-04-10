import { IsEnum } from 'class-validator';
import { EventStatus } from '../../auth/enums/event-status.enum';

export class CloseEventDto {
  @IsEnum(EventStatus)
  status: EventStatus;
}

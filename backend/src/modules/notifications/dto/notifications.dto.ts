import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
} from 'class-validator';

/**
 * Query param DTO for GET /notifications/mine?since=<ISO timestamp>.
 * `since` is an ISO 8601 datetime; if present, only notifications with
 * createdAt > since are returned. Clock skew is avoided by the controller
 * returning a `serverTime` that the client uses as the next `since` value.
 */
export class GetNotificationsQueryDto {
  @ApiPropertyOptional({
    description: 'ISO 8601 timestamp; only notifications created after this moment are returned',
    example: '2026-05-23T14:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  since?: string;
}

export class MarkNotificationsReadDto {
  @ApiProperty({
    description: 'IDs of notifications to mark as read (max 50)',
    type: [String],
    maxItems: 50,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @IsString({ each: true })
  ids!: string[];
}

export class NotificationDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ description: 'Notification type, e.g. "hero_mail"' })
  type!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  body!: string;

  @ApiProperty({ description: 'Arbitrary structured payload (varies by type)', type: Object })
  data!: unknown;

  @ApiProperty()
  isRead!: boolean;

  @ApiPropertyOptional({ description: 'When the user marked this notification as read' })
  readAt!: Date | null;

  @ApiProperty()
  createdAt!: Date;
}

export class GetNotificationsResponseDto {
  @ApiProperty({ type: [NotificationDto] })
  notifications!: NotificationDto[];

  @ApiProperty({
    description: 'Authoritative server time at response — pass as next `since` to avoid clock skew',
  })
  serverTime!: string;
}

export class MarkNotificationsReadResponseDto {
  @ApiProperty({ description: 'Number of notification rows updated' })
  updated!: number;
}

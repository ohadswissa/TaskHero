import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateAssignmentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  missionId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  childProfileId!: string;
}

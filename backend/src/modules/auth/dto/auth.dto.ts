import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsOptional,
  Matches,
} from 'class-validator';

export class RegisterParentDto {
  @ApiProperty({ example: 'parent@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'SecurePass123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  password!: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  displayName!: string;

  @ApiPropertyOptional({ example: 'The Smith Family' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  familyName?: string;

  @ApiPropertyOptional({ example: 'Asia/Jerusalem' })
  @IsString()
  @IsOptional()
  timezone?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'parent@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class ChildLoginDto {
  @ApiProperty({ example: 'ABC123XY', description: 'Family invite code' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(12)
  familyCode!: string;

  @ApiProperty({ example: '1234', description: 'Child PIN code' })
  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  @MaxLength(6)
  pin!: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

export class LogoutDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

export class TokenResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;

  @ApiProperty({ description: 'Access token expiry in milliseconds' })
  expiresIn!: number;

  @ApiProperty()
  user!: {
    id: string;
    email: string | null;
    role: string;
    familyId: string;
    displayName?: string;
  };
}

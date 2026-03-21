import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  RegisterParentDto,
  LoginDto,
  ChildLoginDto,
  TokenResponseDto,
  RefreshTokenDto,
  LogoutDto,
} from './dto';
import { Public } from '@/common/decorators';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Public()
  @ApiOperation({ summary: 'Register a new parent account and family' })
  @ApiResponse({
    status: 201,
    description: 'Successfully registered',
    type: TokenResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async register(@Body() dto: RegisterParentDto): Promise<TokenResponseDto> {
    return this.authService.registerParent(dto);
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login as parent with email and password' })
  @ApiResponse({
    status: 200,
    description: 'Successfully logged in',
    type: TokenResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto): Promise<TokenResponseDto> {
    return this.authService.loginParent(dto);
  }

  @Post('login/child')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login as child with family code and PIN' })
  @ApiResponse({
    status: 200,
    description: 'Successfully logged in',
    type: TokenResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid family code or PIN' })
  async loginChild(@Body() dto: ChildLoginDto): Promise<TokenResponseDto> {
    return this.authService.loginChild(dto);
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'Tokens refreshed successfully',
    type: TokenResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(@Body() dto: RefreshTokenDto): Promise<TokenResponseDto> {
    return this.authService.refreshTokens(dto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Logout and revoke refresh token' })
  @ApiResponse({ status: 204, description: 'Successfully logged out' })
  async logout(@Body() dto: LogoutDto): Promise<void> {
    await this.authService.logout(dto.refreshToken);
  }
}

import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@/database';
import { generateInviteCode } from '@/common/utils';
import {
  RegisterParentDto,
  LoginDto,
  ChildLoginDto,
  TokenResponseDto,
  RefreshTokenDto,
} from './dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Register a new parent user and create family
   */
  async registerParent(dto: RegisterParentDto): Promise<TokenResponseDto> {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const saltRounds = this.configService.get<number>('BCRYPT_SALT_ROUNDS', 12);
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    // Generate unique invite code
    let inviteCode = generateInviteCode();
    let codeExists = await this.prisma.family.findUnique({
      where: { inviteCode },
    });
    while (codeExists) {
      inviteCode = generateInviteCode();
      codeExists = await this.prisma.family.findUnique({
        where: { inviteCode },
      });
    }

    // Create family, user, and parent profile in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create family
      const family = await tx.family.create({
        data: {
          name: dto.familyName || `${dto.displayName}'s Family`,
          inviteCode,
          timezone: dto.timezone || 'UTC',
        },
      });

      // Create user
      const user = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          role: UserRole.PARENT,
          familyId: family.id,
          parentProfile: {
            create: {
              displayName: dto.displayName,
            },
          },
        },
        include: {
          parentProfile: true,
        },
      });

      return { user, family };
    });

    this.logger.log(`New parent registered: ${result.user.email}`);

    // Generate tokens
    return this.generateTokens(result.user);
  }

  /**
   * Login parent with email and password
   */
  async loginParent(dto: LoginDto): Promise<TokenResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { parentProfile: true, family: true },
    });

    if (!user || user.role !== UserRole.PARENT) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    this.logger.log(`Parent logged in: ${user.email}`);

    return this.generateTokens(user);
  }

  /**
   * Login child with family code and PIN
   */
  async loginChild(dto: ChildLoginDto): Promise<TokenResponseDto> {
    // Find family by invite code
    const family = await this.prisma.family.findUnique({
      where: { inviteCode: dto.familyCode },
    });

    if (!family) {
      throw new UnauthorizedException('Invalid family code');
    }

    // Find child user by PIN within family
    const user = await this.prisma.user.findFirst({
      where: {
        familyId: family.id,
        role: UserRole.CHILD,
        pin: dto.pin,
        isActive: true,
      },
      include: { childProfile: true, family: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid PIN');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    this.logger.log(`Child logged in: ${user.childProfile?.displayName}`);

    return this.generateTokens(user);
  }

  /**
   * Refresh access token
   */
  async refreshTokens(dto: RefreshTokenDto): Promise<TokenResponseDto> {
    const refreshTokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: dto.refreshToken },
      include: { user: { include: { family: true } } },
    });

    if (!refreshTokenRecord) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (refreshTokenRecord.revokedAt) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    if (refreshTokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    // Revoke old refresh token
    await this.prisma.refreshToken.update({
      where: { id: refreshTokenRecord.id },
      data: { revokedAt: new Date() },
    });

    return this.generateTokens(refreshTokenRecord.user);
  }

  /**
   * Logout - revoke refresh token
   */
  async logout(refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Revoke all refresh tokens for a user
   */
  async revokeAllTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Generate access and refresh tokens
   */
  private async generateTokens(user: {
    id: string;
    email: string | null;
    role: string;
    familyId: string | null;
    parentProfile?: { displayName: string } | null;
    childProfile?: { displayName: string } | null;
  }): Promise<TokenResponseDto> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      familyId: user.familyId,
    };

    const accessToken = this.jwtService.sign(payload);

    // Generate refresh token
    const refreshTokenExpiry = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: refreshTokenExpiry,
    });

    // Calculate expiry date
    const expiresIn = this.parseExpiry(refreshTokenExpiry);
    const expiresAt = new Date(Date.now() + expiresIn);

    // Store refresh token
    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.parseExpiry(this.configService.get<string>('JWT_EXPIRES_IN', '15m')),
      user: {
        id: user.id,
        email: user.email ?? '',
        role: user.role,
        familyId: user.familyId ?? '',
        displayName: user.parentProfile?.displayName || user.childProfile?.displayName,
      },
    };
  }

  /**
   * Parse expiry string to milliseconds
   */
  private parseExpiry(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 900000; // Default 15 minutes

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        return 900000;
    }
  }
}

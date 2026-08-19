import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {}

  private hashPassword(password: string) {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
  }

  private verifyPassword(password: string, stored: string) {
    const [salt, key] = stored.split(':');
    if (!salt || !key) return false;
    const derived = scryptSync(password, salt, 64);
    return timingSafeEqual(derived, Buffer.from(key, 'hex'));
  }

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('An account with this email already exists.');

    const organization = await this.prisma.organization.create({
      data: { name: dto.organizationName.trim(), country: dto.country.trim(), currency: dto.currency.trim().toUpperCase() },
    });

    const user = await this.prisma.user.create({
      data: { name: dto.name.trim(), email, passwordHash: this.hashPassword(dto.password), role: 'OWNER', organizationId: organization.id },
      select: { id: true, name: true, email: true, role: true, organizationId: true },
    });

    const access_token = await this.jwt.signAsync({ sub: user.id, email: user.email, organizationId: user.organizationId, role: user.role });
    return { access_token, user };
  }

  async login(emailInput: string, password: string) {
    const email = emailInput.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !this.verifyPassword(password, user.passwordHash)) throw new UnauthorizedException('Invalid email or password.');
    const access_token = await this.jwt.signAsync({ sub: user.id, email: user.email, organizationId: user.organizationId, role: user.role });
    return { access_token, user: { id: user.id, name: user.name, email: user.email, role: user.role, organizationId: user.organizationId } };
  }
}

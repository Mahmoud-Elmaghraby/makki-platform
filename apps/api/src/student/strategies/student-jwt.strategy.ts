import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

type StudentJwtPayload = {
  sub: string;
  phone: string | null;
  type: string;
};

@Injectable()
export class StudentJwtStrategy extends PassportStrategy(
  Strategy,
  'jwt-student',
) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET as string,
    });
  }

  async validate(payload: StudentJwtPayload) {
    if (payload.type !== 'student') {
      throw new UnauthorizedException('توكن غير صالح');
    }

    const student = await this.prisma.student.findUnique({
      where: { id: payload.sub },
    });

    if (!student || !student.isActive) {
      throw new UnauthorizedException('الطالب مش موجود');
    }

    return { id: student.id, phone: student.phone, type: 'student' as const };
  }
}

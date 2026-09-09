import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { HlsTokenService } from '../hls-token.service';

@Injectable()
export class HlsManifestTokenGuard implements CanActivate {
  constructor(private readonly hlsTokenService: HlsTokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.query?.token as string | undefined;
    const lessonId = request.params?.id;

    if (!token) {
      throw new UnauthorizedException('لازم توكن صالح');
    }

    let payload: { lessonId: string };
    try {
      payload = await this.hlsTokenService.verify(token);
    } catch {
      throw new UnauthorizedException('التوكن مش صالح أو منتهي');
    }

    if (payload.lessonId !== lessonId) {
      throw new UnauthorizedException('التوكن مش صالح للدرس ده');
    }

    return true;
  }
}

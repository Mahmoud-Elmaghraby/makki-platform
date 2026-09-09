import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

// A viewing session's manifest token AND every presigned segment URL minted
// during that session share this TTL. A VOD playlist is fetched once by the
// player (no periodic re-fetch), so segment URLs must stay valid for the
// whole watch — including pauses/rewinds — not just the first few minutes.
export const PLAYBACK_SESSION_TTL_SECONDS = 4 * 60 * 60;

interface HlsManifestPayload {
  lessonId: string;
}

@Injectable()
export class HlsTokenService {
  constructor(private readonly jwtService: JwtService) {}

  sign(lessonId: string): Promise<string> {
    return this.jwtService.signAsync(
      { lessonId } satisfies HlsManifestPayload,
      { expiresIn: PLAYBACK_SESSION_TTL_SECONDS },
    );
  }

  verify(token: string): Promise<HlsManifestPayload> {
    return this.jwtService.verifyAsync<HlsManifestPayload>(token);
  }
}

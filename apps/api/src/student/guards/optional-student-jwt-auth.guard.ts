import { Injectable } from '@nestjs/common';
import { StudentJwtAuthGuard } from './student-jwt-auth.guard';

/**
 * Same as StudentJwtAuthGuard but never throws: an anonymous request just
 * gets `req.user === null` instead of a 401. Needed for endpoints that serve
 * both anonymous visitors (free-preview lessons) and logged-in students.
 */
@Injectable()
export class OptionalStudentJwtAuthGuard extends StudentJwtAuthGuard {
  handleRequest<TUser = unknown>(err: unknown, user: unknown): TUser {
    return (user ?? null) as TUser;
  }
}

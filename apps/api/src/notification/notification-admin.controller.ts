import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../generated/prisma/enums';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.MANAGER, Role.INSTRUCTOR)
@Controller('notifications/admin')
export class NotificationAdminController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  list() {
    return this.notificationService.listForAdmin();
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string) {
    return this.notificationService.markReadForAdmin(id);
  }

  @Patch('read-all')
  markAllRead() {
    return this.notificationService.markAllReadForAdmin();
  }
}

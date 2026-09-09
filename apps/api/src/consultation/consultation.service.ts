import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationType, ConsultationStatus, ConsultationType } from '../generated/prisma/enums';
import { CreateConsultationRequestDto } from './dto/create-consultation-request.dto';
import { UpdateConsultationStatusDto } from './dto/update-consultation-status.dto';

const TYPE_LABELS: Record<ConsultationType, string> = {
  LEGAL_CONSULTATION: 'استشارة قانونية',
  COURSE_INQUIRY: 'استفسار عن كورس',
  TRAINING_INQUIRY: 'استفسار عن دورة تدريبية',
};

@Injectable()
export class ConsultationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  // ============================================================
  // الفورم العام — صفحة "تواصل معنا"
  // ============================================================

  async create(dto: CreateConsultationRequestDto) {
    const request = await this.prisma.consultationRequest.create({ data: dto });

    await this.notificationService.notifyAdmin({
      type: NotificationType.CONSULTATION_REQUEST,
      title: `طلب تواصل جديد: ${TYPE_LABELS[dto.type]}`,
      body: `من ${dto.name} — ${dto.phone}`,
      link: `/admin/consultations`,
    });

    return request;
  }

  // ============================================================
  // لوحة الأدمن
  // ============================================================

  async adminList(filters: { status?: ConsultationStatus; type?: ConsultationType }) {
    return this.prisma.consultationRequest.findMany({
      where: {
        status: filters.status,
        type: filters.type,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async adminUpdateStatus(id: string, dto: UpdateConsultationStatusDto) {
    const existing = await this.prisma.consultationRequest.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('طلب التواصل ده مش موجود');
    }
    return this.prisma.consultationRequest.update({
      where: { id },
      data: { status: dto.status },
    });
  }
}

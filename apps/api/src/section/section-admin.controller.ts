import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { SectionService } from './section.service';
import { CreateSectionDto, UpdateSectionDto } from './dto/section.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../generated/prisma/enums';

type ActorRequest = Request & { user: { role: Role; instructorId: string | null } };

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.MANAGER, Role.INSTRUCTOR)
@Controller('courses/:courseId/sections')
export class SectionAdminController {
  constructor(private readonly sectionService: SectionService) {}

  @Get()
  findAll(@Param('courseId') courseId: string, @Req() req: ActorRequest) {
    return this.sectionService.findAllForCourseAdmin(courseId, req.user);
  }

  @Post()
  create(
    @Param('courseId') courseId: string,
    @Body() dto: CreateSectionDto,
    @Req() req: ActorRequest,
  ) {
    return this.sectionService.create(courseId, dto, req.user);
  }

  @Patch(':id')
  update(
    @Param('courseId') courseId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSectionDto,
    @Req() req: ActorRequest,
  ) {
    return this.sectionService.update(courseId, id, dto, req.user);
  }

  @Delete(':id')
  remove(
    @Param('courseId') courseId: string,
    @Param('id') id: string,
    @Req() req: ActorRequest,
  ) {
    return this.sectionService.remove(courseId, id, req.user);
  }
}

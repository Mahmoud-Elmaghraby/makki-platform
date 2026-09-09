import { Controller, Get, Post, Patch, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { UserAdminService } from './user-admin.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../generated/prisma/enums';

type AuthedRequest = Request & { user: { id: string; role: Role } };

// إدارة حسابات الطاقم (أدمن/مدير/مدرب) — الأدمن بس هو اللي يقدر يوصل هنا
// (مختلف عن باقي controllers الأدمن التانية اللي المدير بيشارك فيها الصلاحية
// — إدارة الحسابات نفسها حاجة حساسة سيبناها للأدمن بس).
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/users')
export class UserAdminController {
  constructor(private readonly userAdminService: UserAdminService) {}

  @Get()
  findAll() {
    return this.userAdminService.adminList();
  }

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.userAdminService.adminCreate(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.userAdminService.adminUpdate(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: AuthedRequest) {
    return this.userAdminService.adminDelete(id, req.user.id);
  }
}

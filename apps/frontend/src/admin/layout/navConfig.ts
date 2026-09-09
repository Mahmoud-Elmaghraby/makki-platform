import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Users,
  UserCog,
  ClipboardCheck,
  Award,
  Wallet,
  ClipboardList,
  MessageCircle,
} from "lucide-react";
import type { Role } from "../types/api";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  roles?: Role[];
  end?: boolean;
}

export const navItems: NavItem[] = [
  { label: "الرئيسية", to: "/admin", icon: LayoutDashboard, end: true },
  { label: "الكورسات", to: "/admin/courses", icon: BookOpen, end: true },
  { label: "الدورات التدريبية", to: "/admin/trainings", icon: GraduationCap, end: true },
  { label: "تصحيح الامتحانات", to: "/admin/grading", icon: ClipboardCheck },
  { label: "المستخدمين", to: "/admin/users", icon: UserCog, roles: ["ADMIN"] },
  { label: "الطلاب", to: "/admin/students", icon: Users, roles: ["ADMIN"] },
  { label: "الاشتراكات", to: "/admin/enrollments", icon: ClipboardList, roles: ["ADMIN"] },
  { label: "الشهادات", to: "/admin/certificates", icon: Award, roles: ["ADMIN"] },
  { label: "المدفوعات", to: "/admin/payments", icon: Wallet, roles: ["ADMIN", "MANAGER"] },
  { label: "طلبات التواصل", to: "/admin/consultations", icon: MessageCircle, roles: ["ADMIN", "MANAGER"] },
];

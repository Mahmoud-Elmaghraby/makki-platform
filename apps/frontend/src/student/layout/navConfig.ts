import type { LucideIcon } from "lucide-react";
import { BookOpen, Award } from "lucide-react";

export interface StudentNavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  end?: boolean;
}

export const studentNavItems: StudentNavItem[] = [
  { label: "كورساتي", to: "/student", icon: BookOpen, end: true },
  { label: "شهاداتي", to: "/student/certificates", icon: Award },
];

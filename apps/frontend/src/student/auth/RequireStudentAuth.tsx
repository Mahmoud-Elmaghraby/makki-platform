import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useStudentAuth } from "./StudentAuthContext";

export function RequireStudentAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useStudentAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/student/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}

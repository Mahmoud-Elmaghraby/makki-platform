import { Routes, Route } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";
import About from "./pages/About";
import Services from "./pages/Services";
import Courses from "./pages/Courses";
import Trainings from "./pages/Trainings";
import CourseDetail from "./pages/CourseDetail";
import Contact from "./pages/Contact";

import { queryClient } from "./admin/lib/queryClient";
import { AdminAuthProvider } from "./admin/auth/AdminAuthContext";
import { ToastProvider } from "./admin/components/ToastContext";
import { RequireAuth } from "./admin/auth/RequireAuth";
import { AdminLayout } from "./admin/layout/AdminLayout";
import { LoginPage } from "./admin/pages/LoginPage";
import { DashboardPage } from "./admin/pages/DashboardPage";
import { CoursesListPage } from "./admin/pages/CoursesListPage";
import { CourseDetailPage } from "./admin/pages/CourseDetailPage";
import { ExamEditorPage } from "./admin/pages/ExamEditorPage";
import { CheckpointEditorPage } from "./admin/pages/CheckpointEditorPage";
import { ExamAttemptsPage } from "./admin/pages/ExamAttemptsPage";
import { ExamAttemptGradingPage } from "./admin/pages/ExamAttemptGradingPage";
import { GradingOverviewPage } from "./admin/pages/GradingOverviewPage";
import { UsersPage } from "./admin/pages/UsersPage";
import { StudentsPage } from "./admin/pages/StudentsPage";
import { EnrollmentsPage } from "./admin/pages/EnrollmentsPage";
import { CertificatesPage } from "./admin/pages/CertificatesPage";
import { PaymentsPage } from "./admin/pages/PaymentsPage";
import { ConsultationsPage } from "./admin/pages/ConsultationsPage";
import { NotFoundPage } from "./admin/pages/NotFoundPage";

import { StudentAuthProvider } from "./student/auth/StudentAuthContext";
import { RequireStudentAuth } from "./student/auth/RequireStudentAuth";
import { StudentLayout } from "./student/layout/StudentLayout";
import { LoginPage as StudentLoginPage } from "./student/pages/LoginPage";
import { RegisterPage as StudentRegisterPage } from "./student/pages/RegisterPage";
import { OAuthCallbackPage } from "./student/pages/OAuthCallbackPage";
import { MyCoursesPage } from "./student/pages/MyCoursesPage";
import { CourseViewPage } from "./student/pages/CourseViewPage";
import { ExamTakePage } from "./student/pages/ExamTakePage";
import { ExamResultPage } from "./student/pages/ExamResultPage";
import { CertificatesPage as StudentCertificatesPage } from "./student/pages/CertificatesPage";
import { PaymentStatusPage } from "./student/pages/PaymentStatusPage";
import { NotFoundPage as StudentNotFoundPage } from "./student/pages/NotFoundPage";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminAuthProvider>
        <StudentAuthProvider>
          <ToastProvider>
          <Routes>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/services" element={<Services />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/trainings" element={<Trainings />} />
              <Route path="/courses/:slug" element={<CourseDetail />} />
              <Route path="/contact" element={<Contact />} />
            </Route>

            <Route path="/student/login" element={<StudentLoginPage />} />
            <Route path="/student/register" element={<StudentRegisterPage />} />
            <Route path="/student/oauth-callback" element={<OAuthCallbackPage />} />
            <Route
              path="/student"
              element={
                <RequireStudentAuth>
                  <StudentLayout />
                </RequireStudentAuth>
              }
            >
              <Route index element={<MyCoursesPage />} />
              <Route path="courses/:slug" element={<CourseViewPage />} />
              <Route path="certificates" element={<StudentCertificatesPage />} />
              <Route path="*" element={<StudentNotFoundPage />} />
            </Route>
            {/* صفحتا الامتحان (الأداء والنتيجة) خارج StudentLayout عمدًا — عايزينهم
                يكونوا full-focus من غير سايدبار يشتّت الطالب وهو بيؤدي الامتحان. */}
            <Route
              path="/student/exams/:examId/take"
              element={
                <RequireStudentAuth>
                  <div className="mx-auto max-w-3xl p-4 md:p-8">
                    <ExamTakePage />
                  </div>
                </RequireStudentAuth>
              }
            />
            <Route
              path="/student/exam-attempts/:attemptId"
              element={
                <RequireStudentAuth>
                  <div className="mx-auto max-w-3xl p-4 md:p-8">
                    <ExamResultPage />
                  </div>
                </RequireStudentAuth>
              }
            />
            {/* صفحة الرجوع من بوابة الدفع (Kashier) — نفس منطق صفحات الامتحان،
                برّه StudentLayout عمدًا عشان تبقى مركّزة من غير سايدبار. */}
            <Route
              path="/student/payments/:paymentId"
              element={
                <RequireStudentAuth>
                  <div className="mx-auto max-w-md p-4 py-16 md:p-8">
                    <PaymentStatusPage />
                  </div>
                </RequireStudentAuth>
              }
            />

            <Route path="/admin/login" element={<LoginPage />} />

            <Route
              path="/admin"
              element={
                <RequireAuth>
                  <AdminLayout />
                </RequireAuth>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="courses" element={<CoursesListPage track="STUDENT_COURSE" />} />
              <Route path="trainings" element={<CoursesListPage track="LAWYER_TRAINING" />} />
              <Route path="courses/:courseId" element={<CourseDetailPage />} />
              <Route path="courses/:courseId/exams/:examId" element={<ExamEditorPage />} />
              <Route
                path="courses/:courseId/lessons/:lessonId/checkpoints"
                element={<CheckpointEditorPage />}
              />
              <Route
                path="courses/:courseId/exams/:examId/attempts"
                element={<ExamAttemptsPage />}
              />
              <Route
                path="courses/:courseId/exams/:examId/attempts/:attemptId"
                element={<ExamAttemptGradingPage />}
              />
              <Route path="grading" element={<GradingOverviewPage />} />
              <Route
                path="users"
                element={
                  <RequireAuth roles={["ADMIN"]}>
                    <UsersPage />
                  </RequireAuth>
                }
              />
              <Route
                path="students"
                element={
                  <RequireAuth roles={["ADMIN", "MANAGER"]}>
                    <StudentsPage />
                  </RequireAuth>
                }
              />
              <Route
                path="enrollments"
                element={
                  <RequireAuth roles={["ADMIN", "MANAGER"]}>
                    <EnrollmentsPage />
                  </RequireAuth>
                }
              />
              <Route
                path="certificates"
                element={
                  <RequireAuth roles={["ADMIN", "MANAGER"]}>
                    <CertificatesPage />
                  </RequireAuth>
                }
              />
              <Route
                path="payments"
                element={
                  <RequireAuth roles={["ADMIN", "MANAGER"]}>
                    <PaymentsPage />
                  </RequireAuth>
                }
              />
              <Route
                path="consultations"
                element={
                  <RequireAuth roles={["ADMIN", "MANAGER"]}>
                    <ConsultationsPage />
                  </RequireAuth>
                }
              />
              <Route path="*" element={<NotFoundPage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          </ToastProvider>
        </StudentAuthProvider>
      </AdminAuthProvider>
    </QueryClientProvider>
  );
}

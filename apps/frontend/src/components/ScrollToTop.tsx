import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// بيضمن إن أي انتقال بين الصفحات (عن طريق Link أو navigate) يبدأ من أول
// الصفحة الجديدة، مش فاضل في نفس مكان السكرول القديم (مثلًا لو كان واقف
// عند الفوتر في الصفحة اللي قبلها). React Router مابيعملش كده تلقائيًا.
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

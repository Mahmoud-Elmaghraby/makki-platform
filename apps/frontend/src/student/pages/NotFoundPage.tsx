import { Link } from "react-router-dom";
import { Button } from "../../admin/components/ui";

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <h1 className="font-display text-3xl font-semibold text-(--color-navy)">404</h1>
      <p className="text-sm text-(--color-muted)">الصفحة اللي بتدور عليها مش موجودة</p>
      <Link to="/student">
        <Button>الرجوع لكورساتي</Button>
      </Link>
    </div>
  );
}

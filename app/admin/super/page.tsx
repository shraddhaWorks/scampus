import RequireRole from "@/app/frontend/auth/RequiredRoles";
import SignupPage from "@/app/admin/signup/page";

export default function SchoolSInguppahes() {
  return (
    <RequireRole allowedRoles={["SUPERADMIN"]}>
      <SignupPage />
    </RequireRole>
  );
}

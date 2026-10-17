import { requireAdmin } from "@/lib/auth";
import { AdminDashboard } from "./admin-dashboard";

export const metadata = { title: "Admin" };

export default async function AdminPage() {
  await requireAdmin();
  return <AdminDashboard />;
}

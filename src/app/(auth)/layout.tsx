import type { ReactNode } from "react";

// Auth pages render WITHOUT the AppShell (no navbar / footer)
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

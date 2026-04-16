"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutLink() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const next = pathname ? `${pathname}${query ? `?${query}` : ""}` : "/venues";

  return (
    <Link href={`/logout?next=${encodeURIComponent(next)}`} prefetch={false}>
      <LogOut size={16} />
      Logout
    </Link>
  );
}

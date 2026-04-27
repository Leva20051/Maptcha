import Link from "next/link";
import { Compass, LayoutDashboard, ShieldCheck, Sparkles, UserCircle2 } from "lucide-react";
import { LogoutLink } from "@/components/logout-link";
import type { SessionUser } from "@/lib/types";

type SiteHeaderProps = {
  session: SessionUser | null;
};

export function SiteHeader({ session }: SiteHeaderProps) {
  return (
    <header className="site-header">
      <div className="shell site-header-inner">
        <Link href="/" className="brand-mark">
          <img className="brand-wordmark" src="/maptcha-login-image.png" alt="Maptcha - find cafes around you" />
        </Link>

        <nav className="top-nav">
          <Link href="/venues">
            <Compass size={16} />
            Venues
          </Link>
          <Link href="/curators">
            <Sparkles size={16} />
            Curators
          </Link>
          {session ? (
            <>
              <Link href="/dashboard">
                <LayoutDashboard size={16} />
                Dashboard
              </Link>
              <Link href="/account">
                <UserCircle2 size={16} />
                Account
              </Link>
              {session.role === "curator" ? (
                <Link href="/curator-studio">
                  <Sparkles size={16} />
                  Curator Studio
                </Link>
              ) : null}
              {session.role === "admin" ? (
                <Link href="/admin">
                  <ShieldCheck size={16} />
                  Admin
                </Link>
              ) : null}
              <LogoutLink />
            </>
          ) : (
            <>
              <Link href="/login/user">Regular Login</Link>
              <Link href="/login/curator">Curator Login</Link>
              <Link href="/login/admin">Admin Login</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

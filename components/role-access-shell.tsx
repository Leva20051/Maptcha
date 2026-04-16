import Link from "next/link";
import { SubmitButton } from "@/components/submit-button";
import { loginAdminAction, loginCuratorAction, loginRegularAction } from "@/lib/actions";
import type { AppRole } from "@/lib/types";

type RoleAccessShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  role: AppRole;
  panelTitle: string;
  panelDescription: string;
  previewTitle: string;
  previewItems: string[];
};

const ROLE_COPY = {
  regular: {
    heading: "Regular User Access",
    label: "Sign in as Regular User",
    pendingLabel: "Signing in...",
    identifierPlaceholder: "personA or personA@gmail.com",
    secondaryHref: "/register/user",
    secondaryLabel: "Create regular account",
    tertiaryHref: "/venues",
    tertiaryLabel: "Browse venues",
  },
  curator: {
    heading: "Curator Access",
    label: "Sign in as Curator",
    pendingLabel: "Opening studio...",
    identifierPlaceholder: "saira or saira@ucalgary.ca",
    secondaryHref: "/register/curator",
    secondaryLabel: "Create curator account",
    tertiaryHref: "/curators",
    tertiaryLabel: "Browse curators",
  },
  admin: {
    heading: "Admin Access",
    label: "Sign in as Admin",
    pendingLabel: "Opening admin...",
    identifierPlaceholder: "Praveen or praveen@ucalgary.ca",
    secondaryHref: "/venues",
    secondaryLabel: "Open public app",
    tertiaryHref: "/curators",
    tertiaryLabel: "View curators",
  },
} as const;

function getLoginAction(role: AppRole) {
  if (role === "admin") {
    return loginAdminAction;
  }

  if (role === "curator") {
    return loginCuratorAction;
  }

  return loginRegularAction;
}

export function RoleAccessShell({
  eyebrow,
  title,
  description,
  role,
  panelTitle,
  panelDescription,
  previewTitle,
  previewItems,
}: RoleAccessShellProps) {
  const copy = ROLE_COPY[role];
  const action = getLoginAction(role);

  return (
    <div className="page">
      <div className="shell page-stack">
        <section className="hero stack">
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </section>

        <section className="split-grid">
          <article className="glass-card stack">
            <div className="section-heading">
              <div className="stack">
                <span className="eyebrow">{copy.heading}</span>
                <h2>{panelTitle}</h2>
                <p>{panelDescription}</p>
              </div>
            </div>
            <form action={action} className="stack">
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="identifier">Username or email</label>
                  <input id="identifier" name="identifier" placeholder={copy.identifierPlaceholder} required />
                </div>
                <div className="field">
                  <label htmlFor="password">Password</label>
                  <input id="password" name="password" type="password" required />
                </div>
              </div>
              <div className="button-row">
                <SubmitButton label={copy.label} pendingLabel={copy.pendingLabel} />
                <Link href={copy.secondaryHref} className="button button-secondary">
                  {copy.secondaryLabel}
                </Link>
                <Link href={copy.tertiaryHref} className="button button-ghost">
                  {copy.tertiaryLabel}
                </Link>
              </div>
            </form>
          </article>

          <article className="glass-card stack">
            <div className="stack">
              <span className="eyebrow">Inside this area</span>
              <h2>{previewTitle}</h2>
            </div>
            <div className="card-grid">
              {previewItems.map((item) => (
                <article key={item} className="feature-card">
                  <p>{item}</p>
                </article>
              ))}
            </div>
          </article>
        </section>
      </div>
    </div>
  );
}

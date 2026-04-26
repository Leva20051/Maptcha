import Link from "next/link";
import { BarChart3, EyeOff, Globe2, Lock, Mail, MonitorCheck, Settings, ShieldCheck, Store, User, UserCheck } from "lucide-react";
import { SubmitButton } from "@/components/submit-button";
import { loginAdminAction } from "@/lib/actions";

export default function AdminLoginPage() {
  return (
    <div className="page regular-login-page">
      <div className="shell page-stack">
        <section className="regular-login-hero role-login-hero">
          <span className="eyebrow">Admin Console</span>
          <h1>
            Welcome <span>back!</span>
          </h1>
          <p>Sign in to access the operations console and continue managing the platform.</p>
          <div className="login-hero-points">
            <div>
              <span>
                <BarChart3 size={22} aria-hidden="true" />
              </span>
              <strong>Manage operations</strong>
              <small>Oversee venues, curators, and system activity.</small>
            </div>
            <div>
              <span>
                <ShieldCheck size={22} aria-hidden="true" />
              </span>
              <strong>Moderate & approve</strong>
              <small>Review submissions, tags, badges, and more.</small>
            </div>
            <div>
              <span>
                <Settings size={22} aria-hidden="true" />
              </span>
              <strong>Everything in control</strong>
              <small>Access all tools and data from one secure hub.</small>
            </div>
          </div>
        </section>

        <section className="regular-login-grid">
          <article className="login-panel login-form-panel">
            <div className="login-panel-icon">
              <User size={28} aria-hidden="true" />
            </div>
            <span className="eyebrow">Admin Access</span>
            <h2>
              Sign in to your <span>console.</span>
            </h2>
            <form action={loginAdminAction} className="login-form">
              <div className="login-field">
                <label htmlFor="identifier">Username or email</label>
                <div>
                  <Mail size={18} aria-hidden="true" />
                  <input id="identifier" name="identifier" placeholder="Praveen or praveen@ucalgary.ca" required />
                </div>
              </div>
              <div className="login-field">
                <label htmlFor="password">Password</label>
                <div>
                  <Lock size={18} aria-hidden="true" />
                  <input id="password" name="password" type="password" placeholder="Enter your password" required />
                  <EyeOff size={18} aria-hidden="true" />
                </div>
              </div>
              <div className="login-action-row login-admin-action-row">
                <SubmitButton label="Sign in as Admin" pendingLabel="Opening admin..." />
              </div>
              <div className="login-divider">
                <span>or</span>
              </div>
              <div className="admin-login-links">
                <Link href="/venues">
                  <Globe2 size={17} aria-hidden="true" />
                  Open public app
                </Link>
                <Link href="/curators">
                  <UserCheck size={17} aria-hidden="true" />
                  View curators
                </Link>
              </div>
            </form>
          </article>

          <article className="login-panel login-benefits-panel">
            <div className="login-panel-icon login-panel-icon-pink">
              <MonitorCheck size={28} aria-hidden="true" />
            </div>
            <span className="eyebrow">Inside the Console</span>
            <h2>
              What is inside the <span>console.</span>
            </h2>
            <div className="login-benefit-list">
              <div>
                <span>
                  <Store size={24} aria-hidden="true" />
                </span>
                <div>
                  <strong>Venue & content management</strong>
                  <small>Create, edit, and organize venues, categories, tags, and badges.</small>
                </div>
              </div>
              <div>
                <span>
                  <UserCheck size={24} aria-hidden="true" />
                </span>
                <div>
                  <strong>Approvals & moderation</strong>
                  <small>Verify curators, approve submissions, and moderate reviews.</small>
                </div>
              </div>
              <div>
                <span>
                  <BarChart3 size={24} aria-hidden="true" />
                </span>
                <div>
                  <strong>System & data control</strong>
                  <small>Manage users, mappings, reports, and platform settings all in one place.</small>
                </div>
              </div>
            </div>
          </article>
        </section>

        <section className="login-security-strip">
          <span>
            <ShieldCheck size={21} aria-hidden="true" />
          </span>
          <div>
            <strong>Secure & reliable</strong>
            <p>Enterprise-grade security protects your platform.</p>
          </div>
          <Lock className="login-lock-art" size={58} aria-hidden="true" />
        </section>
      </div>
    </div>
  );
}

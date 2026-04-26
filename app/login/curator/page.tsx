import Link from "next/link";
import { BarChart3, Eye, FileText, Grid2X2, Lock, Mail, ShieldCheck, Users } from "lucide-react";
import { SubmitButton } from "@/components/submit-button";
import { loginCuratorAction } from "@/lib/actions";

export default function CuratorLoginPage() {
  return (
    <div className="page regular-login-page">
      <div className="shell page-stack">
        <section className="regular-login-hero role-login-hero">
          <span className="eyebrow">Curator Studio</span>
          <h1>
            Welcome <span>back</span>
          </h1>
          <p>Sign in to access your curator studio and keep building trusted recommendations.</p>
          <div className="login-hero-points">
            <div>
              <span>
                <Grid2X2 size={22} aria-hidden="true" />
              </span>
              <strong>Manage with ease</strong>
              <small>Tools for curators to manage and grow.</small>
            </div>
            <div>
              <span>
                <Users size={22} aria-hidden="true" />
              </span>
              <strong>Curate & connect</strong>
              <small>Review, recommend, and engage your network.</small>
            </div>
            <div>
              <span>
                <ShieldCheck size={22} aria-hidden="true" />
              </span>
              <strong>Everything in one place</strong>
              <small>Access all curator tools in one hub.</small>
            </div>
          </div>
        </section>

        <section className="regular-login-grid">
          <article className="login-panel login-form-panel">
            <div className="login-panel-icon">
              <Users size={28} aria-hidden="true" />
            </div>
            <span className="eyebrow">Curator Access</span>
            <h2>
              Sign in to your <span>studio.</span>
            </h2>
            <form action={loginCuratorAction} className="login-form">
              <div className="login-field">
                <label htmlFor="identifier">Username or email</label>
                <div>
                  <Mail size={18} aria-hidden="true" />
                  <input id="identifier" name="identifier" placeholder="saira or saira@ucalgary.ca" required />
                </div>
              </div>
              <div className="login-field">
                <label htmlFor="password">Password</label>
                <div>
                  <Lock size={18} aria-hidden="true" />
                  <input id="password" name="password" type="password" placeholder="Enter your password" required />
                  <Eye size={18} aria-hidden="true" />
                </div>
              </div>
              <div className="login-action-row">
                <SubmitButton label="Sign in as Curator" pendingLabel="Opening studio..." />
                <Link href="/register/curator">Create curator account</Link>
              </div>
              <div className="login-divider">
                <span>or</span>
              </div>
              <Link href="/curators" className="browse-venues-link">
                <Users size={17} aria-hidden="true" />
                Browse curators
              </Link>
            </form>
          </article>

          <article className="login-panel login-benefits-panel">
            <div className="login-panel-icon login-panel-icon-pink">
              <ShieldCheck size={28} aria-hidden="true" />
            </div>
            <span className="eyebrow">After Sign-In</span>
            <h2>
              What you’ll <span>get.</span>
            </h2>
            <div className="login-benefit-list">
              <div>
                <span>
                  <Users size={24} aria-hidden="true" />
                </span>
                <div>
                  <strong>Curator profile controls</strong>
                  <small>Manage your bio, expertise, and public identity.</small>
                </div>
              </div>
              <div>
                <span>
                  <FileText size={24} aria-hidden="true" />
                </span>
                <div>
                  <strong>Recommendations & reviews</strong>
                  <small>Access recent recommendations and expert reviews.</small>
                </div>
              </div>
              <div>
                <span>
                  <BarChart3 size={24} aria-hidden="true" />
                </span>
                <div>
                  <strong>Submission & activity tools</strong>
                  <small>Track venue submissions, followers, and engagement.</small>
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
            <strong>Secure & private</strong>
            <p>Your curator tools stay protected.</p>
          </div>
          <Lock className="login-lock-art" size={58} aria-hidden="true" />
        </section>
      </div>
    </div>
  );
}

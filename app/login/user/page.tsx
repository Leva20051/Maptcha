import Link from "next/link";
import { Building2, Eye, Grid2X2, History, Lock, Mail, ShieldCheck, Star, User, Users } from "lucide-react";
import { SubmitButton } from "@/components/submit-button";
import { loginRegularAction } from "@/lib/actions";

export default function UserLoginPage() {
  return (
    <div className="page regular-login-page">
      <div className="shell page-stack">
        <section className="regular-login-hero">
          <span className="eyebrow">Your Dashboard</span>
          <h1>
            Welcome <span>back!</span>
          </h1>
          <div className="login-hero-points">
            <div>
              <span>
                <Grid2X2 size={22} aria-hidden="true" />
              </span>
              <strong>Stay on track</strong>
              <small>Your personalized dashboard</small>
            </div>
            <div>
              <span>
                <Users size={22} aria-hidden="true" />
              </span>
              <strong>Pick up where you left off</strong>
              <small>Recent activity and follows</small>
            </div>
            <div>
              <span>
                <Star size={22} aria-hidden="true" />
              </span>
              <strong>Everything in one place</strong>
              <small>Badges, check-ins, and more</small>
            </div>
          </div>
        </section>

        <section className="regular-login-grid">
          <article className="login-panel login-form-panel">
            <div className="login-panel-icon">
              <User size={28} aria-hidden="true" />
            </div>
            <span className="eyebrow">Regular User Access</span>
            <h2>
              Sign in to your <span>dashboard.</span>
            </h2>
            <form action={loginRegularAction} className="login-form">
              <div className="login-field">
                <label htmlFor="identifier">Email or Username</label>
                <div>
                  <Mail size={18} aria-hidden="true" />
                  <input id="identifier" name="identifier" placeholder="personA or personA@gmail.com" required />
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
                <SubmitButton label="Sign in" pendingLabel="Signing in..." />
                <Link href="/register/user">Create account</Link>
              </div>
              <div className="login-divider">
                <span>or</span>
              </div>
              <Link href="/venues" className="browse-venues-link">
                <Building2 size={17} aria-hidden="true" />
                Browse venues
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
                  <Grid2X2 size={24} aria-hidden="true" />
                </span>
                <div>
                  <strong>Personalized feed</strong>
                  <small>Venues ranked just for you.</small>
                </div>
              </div>
              <div>
                <span>
                  <History size={24} aria-hidden="true" />
                </span>
                <div>
                  <strong>Recent activity</strong>
                  <small>View your check-ins and follows.</small>
                </div>
              </div>
              <div>
                <span>
                  <Star size={24} aria-hidden="true" />
                </span>
                <div>
                  <strong>Profile control</strong>
                  <small>Weight your profile and improve matches.</small>
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
            <p>Your data stays with your cafe profile.</p>
          </div>
          <Lock className="login-lock-art" size={58} aria-hidden="true" />
        </section>
      </div>
    </div>
  );
}

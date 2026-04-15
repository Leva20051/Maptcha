import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE_NAME } from "./constants";
import { env } from "./env";
import type { AppRole, SessionUser } from "./types";

const secret = new TextEncoder().encode(env.sessionSecret);

type SessionPayload = {
  userId: number;
  username: string;
  email: string;
  role: AppRole;
};

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({
    userId: user.userId,
    username: user.username,
    email: user.email,
    role: user.role,
  } satisfies SessionPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const result = await jwtVerify(token, secret);
    return result.payload as SessionPayload;
  } catch {
    return null;
  }
}

export async function requireSession() {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  return session;
}

export async function requireRole(role: AppRole) {
  const session = await requireSession();

  if (session.role !== role) {
    redirect("/dashboard");
  }

  return session;
}

export async function getRoleHome(role: AppRole) {
  if (role === "admin") {
    return "/admin";
  }

  if (role === "curator") {
    return "/curator-studio";
  }

  return "/dashboard";
}

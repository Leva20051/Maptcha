import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/constants";

const PUBLIC_LOGOUT_FALLBACK = "/venues";

function resolveLogoutDestination(candidate: string | null, requestUrl: URL) {
  if (!candidate) {
    return PUBLIC_LOGOUT_FALLBACK;
  }

  try {
    const url = new URL(candidate, requestUrl);
    if (url.origin !== requestUrl.origin) {
      return PUBLIC_LOGOUT_FALLBACK;
    }

    if (url.pathname === "/logout") {
      return PUBLIC_LOGOUT_FALLBACK;
    }

    return `${url.pathname}${url.search}`;
  } catch {
    return PUBLIC_LOGOUT_FALLBACK;
  }
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const next = requestUrl.searchParams.get("next");
  const referer = request.headers.get("referer");
  const destination =
    resolveLogoutDestination(next, requestUrl) ??
    resolveLogoutDestination(referer, requestUrl);
  const response = new NextResponse(null, {
    status: 307,
    headers: {
      location: destination,
    },
  });
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    path: "/",
    expires: new Date(0),
  });
  return response;
}

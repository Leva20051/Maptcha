import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/constants";

export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    path: "/",
    expires: new Date(0),
  });
  return response;
}

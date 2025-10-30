import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getOptionalRequestContext } from "@cloudflare/next-on-pages";
import { buildQuizUserCookie, clearQuizUserCookie, uuidPattern } from "../functions/_cookies";
import { getDatabase, UserRepository, type DatabaseEnv } from "./server/db";

export const config = {
  matcher: ["/quiz/:publicId"],
};

const redirectToParticipantLanding = (request: NextRequest, status: 302 | 303, cookieValue?: string): NextResponse => {
  const url = new URL("/quiz", request.url);
  const response = NextResponse.redirect(url, status);
  response.headers.set("Cache-Control", "no-store");
  if (cookieValue) {
    response.headers.append("Set-Cookie", clearQuizUserCookie());
    response.headers.append("Set-Cookie", buildQuizUserCookie(cookieValue));
  }
  return response;
};

export default async function middleware(request: NextRequest): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname;
  const publicId = pathname.slice("/quiz/".length).toLowerCase();

  console.info("[middleware] Incoming participant route", { pathname, publicId });

  if (!uuidPattern.test(publicId)) {
    console.error("[middleware] Invalid publicId format", { pathname, publicId });
    return redirectToParticipantLanding(request, 302);
  }

  try {
    const context = getOptionalRequestContext();
    if (!context) {
      console.warn("[middleware] Missing Cloudflare request context");
      return redirectToParticipantLanding(request, 302);
    }

    const envKeys = Object.keys(context.env ?? {});
    console.info("[middleware] Retrieved request context", { envKeys });

    const env = context.env as unknown as DatabaseEnv;
    const db = getDatabase(env);
    const userRepo = new UserRepository(db);
    console.info("[middleware] Looking up participant by publicId");
    const user = await userRepo.getByPublicId(publicId);
    if (!user) {
      console.error("[middleware] User not found for publicId", { publicId });
      return redirectToParticipantLanding(request, 302);
    }

    console.info("[middleware] Authenticated participant via publicId", {
      userId: user.id,
      publicId,
      hasPublicId: Boolean(user.public_id),
    });
    const response = redirectToParticipantLanding(request, 303, user.public_id);
    if (!response.headers.has("set-cookie")) {
      console.warn("[middleware] Redirect response missing Set-Cookie header");
    } else {
      console.info("[middleware] Redirect response includes Set-Cookie header");
    }
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[middleware] Failed to resolve publicId", { publicId, error: message });
    return redirectToParticipantLanding(request, 302);
  }
}

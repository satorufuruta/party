import { buildQuizUserCookie, clearQuizUserCookie, uuidPattern } from "../_cookies";
import { type Env, logError, logInfo } from "../api/_lib";
import { UserRepository, getDatabase } from "../../src/server/db";

const redirectResponse = (
  request: Request,
  status: number,
  cookies?: string | string[]
): Response => {
  const url = new URL(request.url);
  const headers = new Headers({
    Location: `${url.origin}/quiz`,
    "Cache-Control": "no-store",
  });
  if (cookies) {
    const values = Array.isArray(cookies) ? cookies : [cookies];
    for (const cookie of values) {
      headers.append("Set-Cookie", cookie);
    }
  }
  return new Response(null, { status, headers });
};

export const onRequest: PagesFunction<Env> = async ({ request, env, params }) => {
  const rawPublicId = params.publicId;
  if (typeof rawPublicId !== "string" || rawPublicId.trim().length === 0) {
    logError(request, "Missing publicId parameter", { params });
    return redirectResponse(request, 302);
  }

  const publicId = rawPublicId.trim().toLowerCase();
  if (!uuidPattern.test(publicId)) {
    logError(request, "Invalid publicId format", { publicId });
    return redirectResponse(request, 302);
  }

  try {
    const db = getDatabase(env);
    const userRepo = new UserRepository(db);
    const user = await userRepo.getByPublicId(publicId);
    if (!user) {
      logError(request, "User not found for publicId", { publicId });
      return redirectResponse(request, 302);
    }

    logInfo(request, "Authenticated via publicId", {
      userId: user.id,
      publicId,
    });
    return redirectResponse(request, 303, [
      clearQuizUserCookie(),
      buildQuizUserCookie(user.public_id),
    ]);
  } catch (error) {
    logError(request, "Failed to resolve publicId", {
      publicId,
      error: error instanceof Error ? error.message : String(error),
    });
    return redirectResponse(request, 302);
  }
};

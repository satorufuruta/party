export const QUIZ_USER_COOKIE_NAME = "quiz_user";
export const QUIZ_USER_COOKIE_MAX_AGE_SEC = 60 * 60 * 3; // 3 hours

const cookieAttributes = [
  "Path=/quiz",
  `Max-Age=${QUIZ_USER_COOKIE_MAX_AGE_SEC}`,
  "HttpOnly",
  "Secure",
  "SameSite=Lax",
];

const formatExpires = (maxAge: number): string =>
  new Date(Date.now() + maxAge * 1000).toUTCString();

const createCookie = (value: string, options?: { maxAge?: number }): string => {
  const maxAge = options?.maxAge ?? QUIZ_USER_COOKIE_MAX_AGE_SEC;
  const parts = [
    `${QUIZ_USER_COOKIE_NAME}=${value}`,
    ...cookieAttributes.filter((attribute) => !attribute.startsWith("Max-Age")),
    `Max-Age=${maxAge}`,
    `Expires=${maxAge <= 0 ? new Date(0).toUTCString() : formatExpires(maxAge)}`,
  ];
  return parts.join("; ");
};

export const buildQuizUserCookie = (publicId: string): string => createCookie(publicId);

export const clearQuizUserCookie = (): string =>
  createCookie("", { maxAge: 0 });

export const getQuizUserCookie = (request: Request): string | null => {
  const cookieHeader = request.headers.get("Cookie");
  if (!cookieHeader) return null;
  const pairs = cookieHeader.split(";").map((part) => part.trim());
  for (const pair of pairs) {
    const [key, ...rest] = pair.split("=");
    if (key === QUIZ_USER_COOKIE_NAME) {
      return rest.join("=");
    }
  }
  return null;
};

export const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

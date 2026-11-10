import { createHmac, timingSafeEqual } from "node:crypto";

// Optional single-password gate for the office network. It is switched on by
// setting APP_PASSWORD in .env.local; with no password set the app is open.

export const SESSION_COOKIE = "mokhtar_session";
const SESSION_DAYS = 30;
const PRINT_TOKEN_SECONDS = 120;

export function authEnabled(): boolean {
  return Boolean(process.env.APP_PASSWORD);
}

function sign(payload: string): string {
  return createHmac("sha256", `mokhtar-forms:${process.env.APP_PASSWORD ?? ""}`)
    .update(payload)
    .digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function checkPassword(candidate: string): boolean {
  // Compare digests so the comparison takes the same time for any input length.
  return authEnabled() && safeEqual(sign(`pw:${candidate}`), sign(`pw:${process.env.APP_PASSWORD}`));
}

function makeToken(scope: string, lifetimeSeconds: number): string {
  const expires = Math.floor(Date.now() / 1000) + lifetimeSeconds;
  return `${expires}.${sign(`${scope}:${expires}`)}`;
}

function verifyToken(scope: string, token: string | undefined | null): boolean {
  if (!token) return false;
  const [expires, signature] = token.split(".");
  if (!expires || !signature || Number(expires) < Date.now() / 1000) return false;
  return safeEqual(signature, sign(`${scope}:${expires}`));
}

export const createSessionToken = () => makeToken("session", SESSION_DAYS * 86_400);
export const verifySessionToken = (token: string | undefined) => verifyToken("session", token);
export const sessionMaxAge = SESSION_DAYS * 86_400;

/**
 * Short-lived pass that lets the server's own headless browser open one print
 * page (it has no login cookie) while it renders the PDF.
 */
export const createPrintToken = (documentId: number) =>
  makeToken(`print:${documentId}`, PRINT_TOKEN_SECONDS);
export const verifyPrintToken = (documentId: number, token: string | null) =>
  verifyToken(`print:${documentId}`, token);

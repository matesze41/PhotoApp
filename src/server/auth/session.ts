export const SESSION_COOKIE = "photoapp_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 nap

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("AUTH_SECRET nincs beállítva vagy túl rövid (min. 16 karakter).");
  }
  return secret;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function toBase64Url(bytes: Uint8Array): string {
  return bytesToBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(base64Url: string): Uint8Array {
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  return base64ToBytes(padded);
}

async function sign(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getAuthSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return toBase64Url(new Uint8Array(sig));
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;

  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

async function verifySignature(data: string, signatureBase64Url: string) {
  try {
    const expected = await sign(data);
    return constantTimeEqual(fromBase64Url(expected), fromBase64Url(signatureBase64Url));
  } catch {
    return false;
  }
}

export async function createSessionToken(userId: string) {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = `${userId}.${exp}`;
  const signature = await sign(payload);
  return `${payload}.${signature}`;
}

export async function parseSessionToken(token: string | undefined): Promise<string | null> {
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [userId, expRaw, signature] = parts;
  if (!userId || !expRaw || !signature) return null;

  const exp = Number(expRaw);
  if (!Number.isFinite(exp)) return null;

  const now = Math.floor(Date.now() / 1000);
  if (exp < now) return null;

  const validSig = await verifySignature(`${userId}.${expRaw}`, signature);
  if (!validSig) return null;

  return userId;
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}

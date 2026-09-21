import { createHash, randomBytes } from "crypto";

// Tokens look like "fm_sms_<random>". The prefix makes one easy to recognise
// if it ever leaks into a log or a screenshot.
const PREFIX = "fm_sms_";

// We only ever store the SHA-256 hash. If the database leaked, the hashes
// could not be used to post SMS. A plain SHA-256 is enough here (no bcrypt)
// because the token is 32 random bytes, far too many to guess.
export function hashSmsToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateSmsToken(): { token: string; hash: string } {
  const token = PREFIX + randomBytes(32).toString("base64url");
  return { token, hash: hashSmsToken(token) };
}

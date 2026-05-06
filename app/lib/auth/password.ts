import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const PASSWORD_PREFIX = "scrypt";
const KEY_LENGTH = 64;

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  return left.length === right.length && timingSafeEqual(left, right);
}

export function isPasswordHash(value: string) {
  return value.startsWith(`${PASSWORD_PREFIX}$`);
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, KEY_LENGTH).toString("hex");

  return `${PASSWORD_PREFIX}$${salt}$${hash}`;
}

export function verifyPassword(password: string, storedPassword: string) {
  if (!isPasswordHash(storedPassword)) {
    return safeEqual(password, storedPassword);
  }

  const [, salt, expectedHash] = storedPassword.split("$");
  if (!salt || !expectedHash) return false;

  const actualHash = scryptSync(password, salt, KEY_LENGTH);
  const expected = Buffer.from(expectedHash, "hex");

  return actualHash.length === expected.length && timingSafeEqual(actualHash, expected);
}
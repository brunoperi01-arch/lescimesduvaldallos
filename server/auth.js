// Authentification admin — scrypt (Node crypto), comparaison en temps constant.
import { scrypt, randomBytes, timingSafeEqual, createHash } from "node:crypto";
import { promisify } from "node:util";
const scryptAsync = promisify(scrypt);
export let __derivations = 0;
export function __resetDerivations() { __derivations = 0; }
const PARAMS = { N: 16384, r: 8, p: 1, keylen: 64 };

export async function hashPassword(password) {
  const salt = randomBytes(16);
  __derivations++;
  const dk = await scryptAsync(password, salt, PARAMS.keylen, PARAMS);
  return `scrypt$${PARAMS.N}$${PARAMS.r}$${PARAMS.p}$${salt.toString("hex")}$${dk.toString("hex")}`;
}

export async function verifyPassword(password, stored) {
  try {
    const [scheme, N, r, p, saltHex, hashHex] = String(stored).split("$");
    if (scheme !== "scrypt") return false;
    const salt = Buffer.from(saltHex, "hex");
    const expected = Buffer.from(hashHex, "hex");
    __derivations++;
    const dk = await scryptAsync(password, salt, expected.length, { N: +N, r: +r, p: +p });
    return dk.length === expected.length && timingSafeEqual(dk, expected);
  } catch { return false; }
}

// Hash factice FIXE, calculé une seule fois au chargement du module.
// dummyVerify effectue EXACTEMENT une dérivation scrypt (jamais hashPassword),
// pour un temps identique entre utilisateur inconnu/désactivé/mauvais mot de passe.
const DUMMY_HASH = await hashPassword("cimes-constant-dummy-password");
export async function dummyVerify(password) {
  return verifyPassword(password, DUMMY_HASH);
}

export function newSessionToken() { return randomBytes(32).toString("base64url"); }
export function hashToken(token) { return createHash("sha256").update(token).digest("hex"); }

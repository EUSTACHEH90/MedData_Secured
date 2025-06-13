import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "secret-key";

export function signJWT(payload: object, expiresIn = "7d"): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyJWT(token: string): string | jwt.JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

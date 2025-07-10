// import jwt from "jsonwebtoken";

// const JWT_SECRET = process.env.JWT_SECRET || "secret-key";

// export function signJWT(payload: object, expiresIn = "7d"): string {
//   return jwt.sign(payload, JWT_SECRET, { expiresIn });
// }

// export function verifyJWT(token: string): string | jwt.JwtPayload | null {
//   try {
//     return jwt.verify(token, JWT_SECRET);
//   } catch (error) {
//     return null;
//   }
// }


import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";

const JWT_SECRET = (process.env.JWT_SECRET as string) || "secret-key";

export function signJWT(payload: object, expiresIn = "7d"): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn } as SignOptions);
}

export function verifyJWT(token: string): string | JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (typeof decoded === "string") return null;
    return decoded as JwtPayload;
  } catch (error) {
    return null;
  }

  
}

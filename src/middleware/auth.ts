import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export const TOKEN_COOKIE = "studiospace_token";

export interface AuthUser {
  email: string;
  name: string;
  picture?: string;
}

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthUser;
  }
}

// The client signs this JWT after BetterAuth confirms the session, and stores it in an HTTPOnly cookie
export function verifyToken(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[TOKEN_COOKIE];
  if (!token) {
    res.status(401).json({ message: "Unauthorized: please log in first." });
    return;
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string, {
      algorithms: ["HS256"],
      issuer: "studiospace",
    }) as jwt.JwtPayload;
    if (typeof payload.email !== "string") throw new Error("Token has no email");
    req.user = {
      email: payload.email,
      name: String(payload.name ?? ""),
      picture: payload.picture ? String(payload.picture) : undefined,
    };
    next();
  } catch {
    res.status(401).json({ message: "Unauthorized: your session has expired." });
  }
}

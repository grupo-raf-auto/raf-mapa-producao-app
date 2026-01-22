import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: "admin" | "user";
  _id: string; // alias de id para compatibilidade
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";

export async function authenticateUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const token = authHeader.slice(7);

    let decoded: { sub: string; email?: string; name?: string | null };
    try {
      decoded = jwt.verify(token, JWT_SECRET) as typeof decoded;
    } catch {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }

    if (!decoded?.sub) {
      return res
        .status(401)
        .json({ error: "Unauthorized: Invalid token payload" });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });

    if (!user) {
      return res.status(401).json({ error: "Unauthorized: User not found" });
    }

    if (!user.isActive) {
      return res
        .status(403)
        .json({ error: "Forbidden: User account is inactive" });
    }

    const role = (user.role === "admin" ? "admin" : "user") as "admin" | "user";

    req.user = {
      id: user.id,
      _id: user.id,
      email: user.email,
      name: user.name,
      role,
    };

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res
      .status(500)
      .json({ error: "Internal server error during authentication" });
  }
}

import { NextFunction, Request, RequestHandler, Response } from "express";
import { ObjectId } from "mongodb";

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function wrap(handler: (req: Request, res: Response) => Promise<void>): RequestHandler {
  return (req, res, next) => {
    handler(req, res).catch(next);
  };
}

export function asObjectId(value: unknown): ObjectId {
  if (typeof value !== "string" || !ObjectId.isValid(value)) {
    throw new HttpError(404, "Not found.");
  }
  return new ObjectId(value);
}

export function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Accepts only http(s) links, so a stored image can never be a javascript: URL
export function cleanUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    res.status(err.status).json({ message: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ message: "Something went wrong on the server." });
}

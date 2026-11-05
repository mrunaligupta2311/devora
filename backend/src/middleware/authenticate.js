import jwt from "jsonwebtoken";
import { AppError } from "../utils/AppError.js";

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return next(new AppError("Authentication required.", 401));
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET, { algorithms: ["HS256"] });

    req.user = { id: decoded.sub };
    next();
  } catch {
    next(new AppError("Invalid or expired access token.", 401));
  }
}

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import authRoutes from "./routes/authRoutes.js";
import platformRoutes from "./routes/platformRoutes.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { AppError } from "./utils/AppError.js";

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);

const allowedOrigins = (
  process.env.FRONTEND_URL || "http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(helmet());

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new AppError("Origin not allowed by CORS.", 403));
  },
  credentials: true,
}));

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.use("/api", (req, res, next) => {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
  next();
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "alive",
    message: "Devora API is running.",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/health/ready", async (req, res) => {
  try {
    const database = req.app.locals.prisma;

    if (!database) {
      return res.status(503).json({
        success: false,
        status: "not_ready",
        database: "unavailable",
      });
    }

    await database.$queryRaw`SELECT 1`;

    return res.status(200).json({
      success: true,
      status: "ready",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Readiness check failed:", error.message);

    return res.status(503).json({
      success: false,
      status: "not_ready",
      database: "disconnected",
    });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api", platformRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;

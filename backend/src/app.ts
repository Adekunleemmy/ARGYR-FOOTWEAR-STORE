import express from "express";
import cors from "cors";
import { config } from "./config";
import router from "./routes";
import { errorHandler } from "./middleware/errorHandler";
import { PrismaClient } from "@prisma/client";

const app = express();
const prisma = new PrismaClient();

// Parse allowed origins from FRONTEND_URL (supports comma-separated values)
const allowedOrigins = (config.FRONTEND_URL || "")
  .split(",")
  .map((url) => url.trim().replace(/\/$/, ""))
  .filter(Boolean);

// Configure CORS with credentials support and dynamic origin matching
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) {
        return callback(null, true);
      }

      const cleanOrigin = origin.replace(/\/$/, "");

      // 1. Check if explicitly in allowedOrigins list from .env
      if (allowedOrigins.includes(cleanOrigin) || allowedOrigins.includes("*")) {
        return callback(null, true);
      }

      // 2. Automatically allow argyrworldwide.com and www.argyrworldwide.com
      if (/^https?:\/\/([a-zA-Z0-9-]+\.)?argyrworldwide\.com$/.test(cleanOrigin)) {
        return callback(null, true);
      }

      // 3. Allow Vercel preview deployments
      if (/^https?:\/\/.*\.vercel\.app$/.test(cleanOrigin)) {
        return callback(null, true);
      }

      // 4. In development, allow localhost on any port
      if (config.NODE_ENV !== "production" && /^https?:\/\/localhost(:\d+)?$/.test(cleanOrigin)) {
        return callback(null, true);
      }

      console.warn(`[CORS] Rejected origin: ${origin}`);
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  }),
);

app.use(express.json());

// Set API routes prefix
app.use("/api", router);

// Health Check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date(),
    uptime: process.uptime(),
  });
});

// Global Error Handler
app.use(errorHandler);

// Run the server if not imported by test suites
if (process.env.NODE_ENV !== "test") {
  app.listen(config.PORT, async () => {
    console.log(`======================================================`);
    console.log(
      `  ARGYR Footwear Platform API - Running in ${config.NODE_ENV}`,
    );
    console.log(`  Local URL: http://localhost:${config.PORT}`);
    console.log(`======================================================`);

    // Verify database connectivity on startup
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log(`  ✅ Database connected successfully`);
    } catch (err: any) {
      console.error(`  ❌ Database connection FAILED:`, err.message);
    } finally {
      console.log(`======================================================`);
    }
  });
}

export default app;

import express from "express";
import cors from "cors";
import { config } from "./config";
import router from "./routes";
import { errorHandler } from "./middleware/errorHandler";
import { PrismaClient } from "@prisma/client";

const app = express();
const prisma = new PrismaClient();

// Configure CORS with credentials support (important for HTTP-only cookies)
app.use(
  cors({
    origin: config.FRONTEND_URL,
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

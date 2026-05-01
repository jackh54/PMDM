import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config.js";
import { runMigrations } from "./db/index.js";
import { requestLogger } from "./middleware/logger.js";
import { requireAuth } from "./middleware/auth.js";
import { basicRateLimit } from "./middleware/rateLimit.js";
import { requestContext } from "./middleware/requestContext.js";
import authRoutes from "./routes/auth.js";
import devicesRoutes from "./routes/devices.js";
import profilesRoutes from "./routes/profiles.js";
import commandsRoutes from "./routes/commands.js";
import groupsRoutes from "./routes/groups.js";
import webhookRoutes from "./routes/webhook.js";
import settingsRoutes from "./routes/settings.js";
import enrollmentRoutes from "./routes/enrollment.js";
import { writeEnrollmentProfile } from "./services/enrollment.js";

runMigrations();
writeEnrollmentProfile();

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(requestContext);
app.use(requestLogger);
app.use(basicRateLimit);

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api/webhook", webhookRoutes);
app.use("/api/enrollment", enrollmentRoutes);
app.use("/api/devices", requireAuth, devicesRoutes);
app.use("/api/profiles", requireAuth, profilesRoutes);
app.use("/api/commands", requireAuth, commandsRoutes);
app.use("/api/groups", requireAuth, groupsRoutes);
app.use("/api/settings", requireAuth, settingsRoutes);
app.get("/enrollment.mobileconfig", (_req, res) => {
  res.redirect("/api/enrollment/mobileconfig");
});

app.use((error, _req, res, _next) => {
  // eslint-disable-next-line no-console
  console.error(error);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(config.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`PMDM backend listening on ${config.PORT}`);
});

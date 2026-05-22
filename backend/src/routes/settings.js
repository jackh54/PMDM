import { Router } from "express";
import { buildReadinessStatus } from "../services/readiness.js";

const router = Router();

router.get("/status", async (_req, res) => {
  res.json(await buildReadinessStatus());
});

export default router;

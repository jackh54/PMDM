import { Router } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config.js";

const router = Router();

router.post("/login", (req, res) => {
  const { username, password } = req.body ?? {};
  if (username !== config.ADMIN_USERNAME || password !== config.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign({ sub: username, role: "admin" }, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN
  });

  return res.json({ token });
});

export default router;

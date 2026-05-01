import { nanoid } from "nanoid";

export function requestContext(req, res, next) {
  const requestId = req.headers["x-request-id"] || nanoid();
  req.requestId = String(requestId);
  res.setHeader("x-request-id", req.requestId);
  next();
}

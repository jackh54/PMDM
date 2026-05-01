import morgan from "morgan";

morgan.token("request-id", (req) => req.requestId ?? "-");
export const requestLogger = morgan(":method :url :status :response-time ms req_id=:request-id");

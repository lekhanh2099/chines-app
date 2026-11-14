import { z } from "zod";

const LogLevelSchema = z.enum(["debug", "info", "warn", "error"]);
type LogLevel = z.infer<typeof LogLevelSchema>;
type LogDetails = Parameters<Console["error"]>;

function write(level: LogLevel, message: string, details: LogDetails) {
 if (
  process.env.NODE_ENV === "production" &&
  (level === LogLevelSchema.enum.debug || level === "info")
 )
  return;

 console[level](message, ...details);
}

export const logger = {
 debug: (message: string, ...details: LogDetails) => write("debug", message, details),
 info: (message: string, ...details: LogDetails) => write("info", message, details),
 warn: (message: string, ...details: LogDetails) => write("warn", message, details),
 error: (message: string, ...details: LogDetails) => write("error", message, details),
};

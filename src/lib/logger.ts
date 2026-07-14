type LogLevel = "debug" | "info" | "warn" | "error";

function write(level: LogLevel, message: string, details: unknown[]) {
 if (process.env.NODE_ENV === "production" && (level === "debug" || level === "info")) return;

 console[level](message, ...details);
}

export const logger = {
 debug: (message: string, ...details: unknown[]) => write("debug", message, details),
 info: (message: string, ...details: unknown[]) => write("info", message, details),
 warn: (message: string, ...details: unknown[]) => write("warn", message, details),
 error: (message: string, ...details: unknown[]) => write("error", message, details),
};

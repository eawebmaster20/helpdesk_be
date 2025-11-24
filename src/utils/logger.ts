import winston from "winston";
import { ERROR_CODES } from "./data";

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console()
    ]
});

function generateTraceId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// custom logger wrapper
export const appLogger = {
    info: (message: string, meta?: any) => {
        logger.info(message, { traceId: generateTraceId() || generateTraceId(), ...meta });
    },
    warn: (message: string, meta?: any) => {
        logger.warn(message, { traceId: generateTraceId() || generateTraceId(), ...meta });
    },
    error: (errorCode:string, additionalInfo:Record<string, any>={}, error=null) => {
        const errorDef = ERROR_CODES[errorCode] || ERROR_CODES.SYSTEM_UNKNOWN_ERROR;
        const traceId = additionalInfo.traceId || generateTraceId();

        const logData: Record<string, any> = {
            errorCode: errorDef.code,
            errorMessage: errorDef.message,
            ...additionalInfo,
            traceId
        };
        if (error) {
            logData.originalError = error;
        }
        logger.error(errorDef.message, logData);

        return {errorCode: errorDef.code, traceId}
    },
};

// for request logging with traceId
export const logRequest = (req: any, res: any, next: any) => {
    const traceId = generateTraceId();
    req.traceId = traceId;
    res.setHeader("X-Trace-Id", traceId);
    appLogger.info(`Incoming request: ${req.method} ${req.url}`, { traceId, params: req.params, query: req.query, ip: req.ip, userAgent: req.get("User-Agent") });
    next();
}
import { Request, Response, NextFunction } from 'express';

const ipRequestMap = new Map<string, { count: number; resetTime: number }>();

const WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS = 100;    // max 100 requests per minute per IP

export const rateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  
  const ipRecord = ipRequestMap.get(ip);
  
  if (!ipRecord) {
    ipRequestMap.set(ip, {
      count: 1,
      resetTime: now + WINDOW_MS,
    });
    return next();
  }
  
  if (now > ipRecord.resetTime) {
    // Reset window
    ipRecord.count = 1;
    ipRecord.resetTime = now + WINDOW_MS;
    return next();
  }
  
  ipRecord.count += 1;
  
  if (ipRecord.count > MAX_REQUESTS) {
    const retryAfter = Math.ceil((ipRecord.resetTime - now) / 1000);
    res.setHeader('Retry-After', retryAfter.toString());
    return res.status(429).json({
      message: `Too many requests from this IP. Please try again after ${retryAfter} seconds.`,
    });
  }
  
  next();
};

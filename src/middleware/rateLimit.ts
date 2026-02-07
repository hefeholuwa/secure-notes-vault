import { rateLimit } from 'express-rate-limit';

/**
 * Robust key generator that respects the 'trust proxy' setting in Express.
 * This prevents IP spoofing in environments behind a reverse proxy.
 */
const keyGenerator = (req: any): string => {
    // If the user is authenticated, use their userId as the key for stricter per-user limits.
    // Otherwise, fall back to their IP address.
    return req.userId || req.ip;
};

/**
 * Global Rate Limiter: Applies to all incoming requests.
 * Moderate threshold to prevent general system abuse.
 */
export const globalRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 200, // 200 requests per 15 minutes per IP/User
    message: { error: 'Overall request limit exceeded. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator
});

/**
 * Auth Rate Limiter: Strictly protects registration and login endpoints.
 * Thwarts brute-force attacks by limiting attempts.
 */
export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 10, // 10 attempts per 15 mins
    message: { error: 'Too many authentication attempts. Please try again after 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator
});

/**
 * AI & Credits Rate Limiter: Protects expensive resource-intensive endpoints.
 * Stricter limit to prevent rapid depletion of credits or AI service abuse.
 */
export const aiRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    limit: 50, // 50 neural operations per hour
    message: { error: 'Neural processing capacity reached. Please slow down and try again in an hour.' },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator
});

/**
 * Authenticated API Limiter: Standard limit for notes and profile operations.
 */
export const authenticatedRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 150,
    message: { error: 'API request limit reached. Please try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator
});

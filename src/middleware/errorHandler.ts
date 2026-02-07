import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(`[Error] ${err.message || err}`);

    if (err instanceof z.ZodError) {
        return res.status(400).json({
            error: 'Validation failed',
            details: err.issues,
        });
    }

    // Prisma error handling could be added here if needed

    const status = err.status || err.statusCode || 500;
    const message = status === 500 ? 'Internal server error' : err.message;

    return res.status(status).json({
        error: message,
    });
};

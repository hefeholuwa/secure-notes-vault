import { Router } from 'express';
import { register, login, getProfile } from '../controllers/auth.js';
import { authenticate } from '../middleware/auth.js';
import { authRateLimiter, authenticatedRateLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.use(authRateLimiter);

router.post('/register', authRateLimiter, register);
router.post('/login', authRateLimiter, login);
router.get('/me', authenticate as any, authenticatedRateLimiter, getProfile);

export default router;

import { Router } from 'express';
import { createNote, getNotes, getNoteById, updateNote, deleteNote } from '../controllers/notes.js';
import { tagNote, chatWithNote, getChatHistory } from '../controllers/ai.js';
import { authenticate } from '../middleware/auth.js';
import { aiRateLimiter, authenticatedRateLimiter } from '../middleware/rateLimit.js';

const router = Router();

// All notes routes require authentication and are protected by per-user rate limiting
router.use(authenticate as any);
router.use(authenticatedRateLimiter);

router.post('/', createNote);
router.get('/', getNotes);
router.get('/:id', getNoteById);
router.patch('/:id', updateNote);
router.delete('/:id', deleteNote);

// AI Actions
router.post('/:id/tags', aiRateLimiter as any, tagNote as any);
router.get('/:id/chat', getChatHistory as any);
router.post('/:id/chat', aiRateLimiter as any, chatWithNote as any);

export default router;

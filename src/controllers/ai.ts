import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.js';
import prisma from '../utils/db.js';
import { generateTags, askNote } from '../services/ai.js';
import { deductCredits, refundCredits, CreditError } from '../services/credit.js';

const idSchema = z.string().cuid();
const chatMessageSchema = z.object({
    message: z.string().trim().min(1).max(2000),
});


export const tagNote = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = z.object({ id: idSchema }).parse(req.params);
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Ownership check
        const note = await prisma.note.findFirst({
            where: {
                id,
                userId
            }
        });

        if (!note) {
            return res.status(404).json({ error: 'Note not found' });
        }

        // --- Credit System Integration ---
        try {
            await deductCredits(userId, 1, 'AI_TAG');
        } catch (error: any) {
            if (error instanceof CreditError) {
                return res.status(error.status).json({ error: error.message });
            }
            throw error;
        }

        const tags = await generateTags(note.content);
        return res.status(200).json({ tags });
    } catch (error: any) {
        console.error('Tag Note Error:', error);
        return res.status(500).json({ error: 'AI Tag generation failed. Please check backend logs.' });
    }
};

export const getChatHistory = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = z.object({ id: idSchema }).parse(req.params);
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Ownership check
        const note = await prisma.note.findFirst({
            where: {
                id,
                userId
            }
        });

        if (!note) {
            return res.status(404).json({ error: 'Note not found' });
        }

        const messages = await prisma.chatMessage.findMany({
            where: { noteId: id },
            orderBy: { createdAt: 'asc' }
        });

        return res.status(200).json({ messages });
    } catch (error: any) {
        console.error('Get Chat History Error Stack:', error.stack || error);
        return res.status(500).json({
            error: 'Failed to retrieve chat history.',
            details: error.message
        });
    }
};

export const chatWithNote = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = z.object({ id: idSchema }).parse(req.params);
        const { message } = chatMessageSchema.parse(req.body);

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const note = await prisma.note.findFirst({
            where: {
                id,
                userId
            },
            include: {
                messages: {
                    orderBy: [
                        { createdAt: 'desc' },
                        { id: 'desc' }
                    ],
                    take: 10
                }
            }
        });

        if (!note) {
            return res.status(404).json({ error: 'Note not found' });
        }

        // --- Credit System Integration ---
        try {
            await deductCredits(userId, 2, 'AI_CHAT');
        } catch (error: any) {
            if (error instanceof CreditError) {
                return res.status(error.status).json({ error: error.message });
            }
            throw error;
        }

        // Prepare history for AI service
        // Ensure strictly alternating roles [user, assistant, user, ...]
        const history: { role: string; content: string }[] = [];
        const rawMessages = note.messages.reverse();

        let lastRole = 'system'; // System is followed by user
        for (const msg of rawMessages) {
            const currentRole = msg.role === 'user' ? 'user' : 'assistant';
            if (currentRole !== lastRole) {
                history.push({ role: currentRole, content: msg.content });
                lastRole = currentRole;
            }
        }

        // Ensure history ends with assistant so the next message can be user
        if (history.length > 0 && history[history.length - 1].role !== 'assistant') {
            history.pop();
        }

        const response = await askNote(note.content, message, history);

        try {
            // Save messages to DB sequentially for better SQLite reliability
            // We use create instead of createMany to ensure cuid() defaults are handled correctly by Prisma
            await prisma.chatMessage.create({
                data: { noteId: id, role: 'user', content: message }
            });
            await prisma.chatMessage.create({
                data: { noteId: id, role: 'assistant', content: response }
            });
        } catch (dbError: any) {
            console.error('Database Chat Persistence Error:', dbError.message);
            // We still return the response even if persistence fails, but we log the error
        }

        return res.status(200).json({ response });
    } catch (error: any) {
        console.error('Chat with Note Controller Error Stack:', error.stack || error);

        // Pass through 429 or other specific status if possible
        const status = error.message.includes('429') ? 429 : 500;
        const userMessage = status === 429
            ? 'The AI is busy. Please wait a few seconds and try again.'
            : 'AI Chat failed. Please try again later.';

        return res.status(status).json({
            error: userMessage,
            details: error.message
        });
    }
};

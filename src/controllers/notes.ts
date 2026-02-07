import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/db.js';
import { AuthRequest } from '../middleware/auth.js';

const noteSchema = z.object({
    title: z.string().trim().min(1).max(500),
    content: z.string().trim().min(1).max(1000000),
    tags: z.string().trim().max(2000).optional().nullable(),
});

const updateNoteSchema = z.object({
    title: z.string().trim().min(1).max(500).optional(),
    content: z.string().trim().min(1).max(1000000).optional(),
    tags: z.string().trim().max(2000).optional().nullable(),
}).refine(data => data.title !== undefined || data.content !== undefined || data.tags !== undefined, {
    message: "At least one of [title, content, tags] must be provided",
});

const idSchema = z.string().cuid();

export const createNote = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { title, content, tags } = noteSchema.parse(req.body);
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({ error: 'User ID missing from request' });
        }

        const note = await prisma.note.create({
            data: {
                title,
                content,
                tags,
                userId,
            },
        });

        return res.status(201).json(note);
    } catch (error) {
        next(error);
    }
};

export const getNotes = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({ error: 'User ID missing from request' });
        }

        const notes = await prisma.note.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });

        return res.status(200).json(notes);
    } catch (error) {
        next(error);
    }
};

export const getNoteById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = z.object({ id: idSchema }).parse(req.params);
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({ error: 'User ID missing from request' });
        }

        const note = await prisma.note.findFirst({
            where: {
                id,
                userId, // Ownership check
            },
        });

        if (!note) {
            return res.status(404).json({ error: 'Note not found' });
        }

        return res.status(200).json(note);
    } catch (error) {
        next(error);
    }
};

export const updateNote = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = z.object({ id: idSchema }).parse(req.params);
        const userId = req.userId;
        const { title, content, tags } = updateNoteSchema.parse(req.body);

        if (!userId) {
            return res.status(401).json({ error: 'User ID missing from request' });
        }

        const note = await prisma.note.updateMany({
            where: {
                id,
                userId, // Ownership check
            },
            data: {
                ...(title && { title }),
                ...(content && { content }),
                ...(tags !== undefined && { tags }),
            },
        });

        if (note.count === 0) {
            return res.status(404).json({ error: 'Note not found or unauthorized' });
        }

        const updatedNote = await prisma.note.findUnique({ where: { id } });

        return res.status(200).json(updatedNote);
    } catch (error) {
        next(error);
    }
};

export const deleteNote = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = z.object({ id: idSchema }).parse(req.params);
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({ error: 'User ID missing from request' });
        }

        const note = await prisma.note.deleteMany({
            where: {
                id,
                userId, // Ownership check
            },
        });

        if (note.count === 0) {
            return res.status(404).json({ error: 'Note not found or unauthorized' });
        }

        return res.status(204).send();
    } catch (error) {
        next(error);
    }
};

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import prisma from '../utils/db.js';

const registerSchema = z.object({
    email: z.string().trim().toLowerCase().email().max(255),
    password: z.string().min(8).max(100),
});

const loginSchema = z.object({
    email: z.string().trim().toLowerCase().email().max(255),
    password: z.string().max(100),
});

export const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = registerSchema.parse(req.body);

        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const hashedPassword = await argon2.hash(password);

        // Create user and log initial credit grant in a single transaction
        await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    credits: 50, // Initial balance
                },
            });

            await tx.creditTransaction.create({
                data: {
                    userId: user.id,
                    amount: 50,
                    type: 'GRANT',
                    service: 'SIGNUP_BONUS',
                },
            });
        });

        return res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        next(error);
    }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = loginSchema.parse(req.body);

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isValidPassword = await argon2.verify(user.password, password);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET as string,
            { expiresIn: '24h' }
        );

        return res.status(200).json({ token });
    } catch (error) {
        next(error);
    }
};

export const getProfile = async (req: any, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, credits: true }
        });

        if (!user) return res.status(404).json({ error: 'User not found' });

        return res.status(200).json(user);
    } catch (error) {
        return res.status(500).json({ error: 'Failed to fetch profile' });
    }
};

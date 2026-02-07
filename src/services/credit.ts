import prisma from '../utils/db.js';

export class CreditError extends Error {
    constructor(message: string, public status: number = 400) {
        super(message);
        this.name = 'CreditError';
    }
}

/**
 * Atomic credit deduction with transaction logging.
 * Prevents double-spending and race conditions.
 */
export const deductCredits = async (userId: string, amount: number, service: string) => {
    return await prisma.$transaction(async (tx) => {
        // 1. Fetch user credits with a check (pessimistic lock equivalent in SQLite via the update where clause)
        // Note: SQLite doesn't support 'FOR UPDATE', but we can check the balance in the update statement.

        // 2. Attempt to update the user's credits ONLY if they have enough
        const updatedUser = await tx.user.updateMany({
            where: {
                id: userId,
                credits: { gte: amount }
            },
            data: {
                credits: { decrement: amount }
            }
        });

        // 3. If no record was updated, it means the user didn't have enough credits or doesn't exist
        if (updatedUser.count === 0) {
            throw new CreditError('Insufficient credits for this operation.', 402);
        }

        // 4. Log the transaction for the audit trail
        await tx.creditTransaction.create({
            data: {
                userId,
                amount: -amount,
                type: 'DEDUCTION',
                service
            }
        });

        return true;
    });
};

/**
 * Refund credits in case of service failure after deduction.
 */
export const refundCredits = async (userId: string, amount: number, service: string) => {
    return await prisma.$transaction(async (tx) => {
        await tx.user.update({
            where: { id: userId },
            data: { credits: { increment: amount } }
        });

        await tx.creditTransaction.create({
            data: {
                userId,
                amount,
                type: 'REFUND',
                service
            }
        });

        return true;
    });
};

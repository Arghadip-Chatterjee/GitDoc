import prisma from "@/lib/prisma";

export type CreditType = "document" | "interview";

const CREDIT_RESET_HOURS = 48;

/**
 * Check if a user has available credits for a specific action type
 * Admins always have unlimited credits
 */
export async function checkCredits(
    userId: string,
    type: CreditType
): Promise<{ hasCredits: boolean; remaining: number; resetAt: Date | null }> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            isAdmin: true,
            documentCredits: true,
            interviewCredits: true,
            documentCreditsResetAt: true,
            interviewCreditsResetAt: true,
        },
    });

    if (!user) {
        throw new Error("User not found");
    }

    // Admins have unlimited credits
    if (user.isAdmin) {
        return { hasCredits: true, remaining: Infinity, resetAt: null };
    }

    // Check and reset credits if needed before checking availability
    await resetCreditsIfNeeded(userId, type);

    // Re-fetch user data after potential reset
    const updatedUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            documentCredits: true,
            interviewCredits: true,
            documentCreditsResetAt: true,
            interviewCreditsResetAt: true,
        },
    });

    if (!updatedUser) {
        throw new Error("User not found");
    }

    const credits = type === "document" ? updatedUser.documentCredits : updatedUser.interviewCredits;
    const resetAt = type === "document" ? updatedUser.documentCreditsResetAt : updatedUser.interviewCreditsResetAt;

    return {
        hasCredits: credits > 0,
        remaining: credits,
        resetAt,
    };
}

/**
 * Consume a credit for a specific action type
 * Sets the reset timer if this is the first credit consumed
 */
export async function consumeCredit(userId: string, type: CreditType): Promise<void> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            isAdmin: true,
            documentCredits: true,
            interviewCredits: true,
            documentCreditsResetAt: true,
            interviewCreditsResetAt: true,
        },
    });

    if (!user) {
        throw new Error("User not found");
    }

    // Don't consume credits for admins
    if (user.isAdmin) {
        return;
    }

    const currentCredits = type === "document" ? user.documentCredits : user.interviewCredits;
    const resetAt = type === "document" ? user.documentCreditsResetAt : user.interviewCreditsResetAt;

    if (currentCredits <= 0) {
        throw new Error(`No ${type} credits available`);
    }

    // Calculate reset time (48 hours from now) if this is the first credit consumed
    const shouldSetResetTimer = resetAt === null;
    const newResetAt = shouldSetResetTimer
        ? new Date(Date.now() + CREDIT_RESET_HOURS * 60 * 60 * 1000)
        : resetAt;

    // Update the appropriate credit field
    if (type === "document") {
        await prisma.user.update({
            where: { id: userId },
            data: {
                documentCredits: currentCredits - 1,
                documentCreditsResetAt: newResetAt,
            },
        });
    } else {
        await prisma.user.update({
            where: { id: userId },
            data: {
                interviewCredits: currentCredits - 1,
                interviewCreditsResetAt: newResetAt,
            },
        });
    }
}

/**
 * Reset credits if 48 hours have passed since the reset timer was set
 */
export async function resetCreditsIfNeeded(userId: string, type: CreditType): Promise<boolean> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            isAdmin: true,
            documentCreditsResetAt: true,
            interviewCreditsResetAt: true,
        },
    });

    if (!user || user.isAdmin) {
        return false;
    }

    const resetAt = type === "document" ? user.documentCreditsResetAt : user.interviewCreditsResetAt;

    // If no reset timer is set, no need to reset
    if (!resetAt) {
        return false;
    }

    // Check if 48 hours have passed
    const now = new Date();
    if (now >= resetAt) {
        // Reset credits to 2 and clear the reset timer
        if (type === "document") {
            await prisma.user.update({
                where: { id: userId },
                data: {
                    documentCredits: 2,
                    documentCreditsResetAt: null,
                },
            });
        } else {
            await prisma.user.update({
                where: { id: userId },
                data: {
                    interviewCredits: 2,
                    interviewCreditsResetAt: null,
                },
            });
        }
        return true;
    }

    return false;
}

/**
 * Get the current credit status for a user
 */
export async function getCreditStatus(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            isAdmin: true,
            documentCredits: true,
            interviewCredits: true,
            documentCreditsResetAt: true,
            interviewCreditsResetAt: true,
        },
    });

    if (!user) {
        throw new Error("User not found");
    }

    // Admins have unlimited credits
    if (user.isAdmin) {
        return {
            isAdmin: true,
            documentCredits: Infinity,
            interviewCredits: Infinity,
            documentCreditsResetAt: null,
            interviewCreditsResetAt: null,
            documentTimeUntilReset: null,
            interviewTimeUntilReset: null,
        };
    }

    // Check and reset credits if needed
    await resetCreditsIfNeeded(userId, "document");
    await resetCreditsIfNeeded(userId, "interview");

    // Re-fetch user data after potential reset
    const updatedUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            documentCredits: true,
            interviewCredits: true,
            documentCreditsResetAt: true,
            interviewCreditsResetAt: true,
        },
    });

    if (!updatedUser) {
        throw new Error("User not found");
    }

    // Calculate time until reset in milliseconds
    const now = Date.now();
    const documentTimeUntilReset = updatedUser.documentCreditsResetAt
        ? Math.max(0, updatedUser.documentCreditsResetAt.getTime() - now)
        : null;
    const interviewTimeUntilReset = updatedUser.interviewCreditsResetAt
        ? Math.max(0, updatedUser.interviewCreditsResetAt.getTime() - now)
        : null;

    return {
        isAdmin: false,
        documentCredits: updatedUser.documentCredits,
        interviewCredits: updatedUser.interviewCredits,
        documentCreditsResetAt: updatedUser.documentCreditsResetAt,
        interviewCreditsResetAt: updatedUser.interviewCreditsResetAt,
        documentTimeUntilReset,
        interviewTimeUntilReset,
    };
}

import crypto from "crypto";

/**
 * Generate a secure random token
 * @param bytes Number of random bytes (default: 32)
 * @returns Hex string token
 */
export function generateToken(bytes: number = 32): string {
    return crypto.randomBytes(bytes).toString("hex");
}

/**
 * Generate a 6-digit OTP code
 * @returns 6-digit string
 */
export function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate email verification OTP with expiration
 * @returns Object with OTP and expiration date (15 minutes from now)
 */
export function generateEmailVerificationToken() {
    const token = generateOTP(); // 6-digit OTP
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 15); // 15 minutes expiration

    return {
        token,
        expires
    };
}

/**
 * Generate password reset token with expiration
 * @returns Object with token and expiration date (1 hour from now)
 */
export function generatePasswordResetToken() {
    const token = generateToken();
    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // 1 hour expiration

    return {
        token,
        expires
    };
}

/**
 * Check if a token has expired
 * @param expiresAt Expiration date
 * @returns true if expired, false otherwise
 */
export function isTokenExpired(expiresAt: Date | null): boolean {
    if (!expiresAt) return true;
    return new Date() > expiresAt;
}

/**
 * Hash a token (optional extra security layer)
 * @param token Plain token
 * @returns Hashed token
 */
export function hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
}

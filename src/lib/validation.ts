import { z } from "zod";

/**
 * Email validation schema
 * Validates email format according to RFC 5322
 */
export const emailSchema = z
    .string()
    .min(1, "Email is required")
    .email("Invalid email format");

/**
 * Mobile number validation schema
 * Supports international format with optional + prefix
 * Format: +[country code][number] or just [number]
 * Examples: +919876543210, 9876543210, +14155552671
 */
export const mobileSchema = z
    .string()
    .min(1, "Mobile number is required")
    .regex(
        /^\+?[1-9]\d{9,14}$/,
        "Invalid mobile number. Must be 10-15 digits, optionally starting with +"
    );

/**
 * Password validation schema
 * Minimum 8 characters for security
 */
export const passwordSchema = z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password is too long");

/**
 * Name validation schema
 */
export const nameSchema = z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long")
    .optional();

/**
 * Signup validation schema
 * Requires email, mobile, and password
 * Name is optional
 */
export const signupSchema = z.object({
    email: emailSchema,
    mobile: mobileSchema,
    name: nameSchema,
    password: passwordSchema,
});

/**
 * Signin validation schema
 * Identifier can be either email or mobile number
 */
export const signinSchema = z.object({
    identifier: z.string().min(1, "Email or mobile number is required"),
    password: z.string().min(1, "Password is required"),
});

/**
 * Helper function to detect if identifier is email or mobile
 */
export function isEmail(identifier: string): boolean {
    return identifier.includes("@");
}

/**
 * Helper function to validate and normalize mobile number
 */
export function normalizeMobile(mobile: string): string {
    // Remove all spaces and dashes
    return mobile.replace(/[\s-]/g, "");
}

// Type exports for TypeScript
export type SignupInput = z.infer<typeof signupSchema>;
export type SigninInput = z.infer<typeof signinSchema>;

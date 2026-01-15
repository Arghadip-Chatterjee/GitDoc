import { parsePhoneNumber, AsYouType } from 'libphonenumber-js';

/**
 * Format phone number as user types based on country code
 * @param value Current input value
 * @param countryCode Country code (e.g., 'US', 'IN')
 * @returns Formatted phone number
 */
export function formatPhoneAsYouType(value: string, countryCode: string): string {
    try {
        const asYouType = new AsYouType(countryCode as any);
        return asYouType.input(value);
    } catch (error) {
        return value;
    }
}

/**
 * Parse and validate phone number
 * @param phoneNumber Phone number string
 * @param countryCode Country code
 * @returns Parsed phone number object or null
 */
export function parsePhone(phoneNumber: string, countryCode: string) {
    try {
        return parsePhoneNumber(phoneNumber, countryCode as any);
    } catch (error) {
        return null;
    }
}

/**
 * Check if phone number is valid
 * @param phoneNumber Phone number string
 * @param countryCode Country code
 * @returns true if valid, false otherwise
 */
export function isValidPhoneNumber(phoneNumber: string, countryCode: string): boolean {
    const parsed = parsePhone(phoneNumber, countryCode);
    return parsed ? parsed.isValid() : false;
}

/**
 * Get international format of phone number
 * @param phoneNumber Phone number string
 * @param countryCode Country code
 * @returns International format (e.g., +1 234 567 8900)
 */
export function getInternationalFormat(phoneNumber: string, countryCode: string): string | null {
    const parsed = parsePhone(phoneNumber, countryCode);
    return parsed ? parsed.formatInternational() : null;
}

/**
 * Get national format of phone number
 * @param phoneNumber Phone number string
 * @param countryCode Country code
 * @returns National format (e.g., (234) 567-8900)
 */
export function getNationalFormat(phoneNumber: string, countryCode: string): string | null {
    const parsed = parsePhone(phoneNumber, countryCode);
    return parsed ? parsed.formatNational() : null;
}

/**
 * Extract just the digits from a phone number
 * @param phoneNumber Phone number string
 * @returns Digits only
 */
export function getPhoneDigits(phoneNumber: string): string {
    return phoneNumber.replace(/\D/g, '');
}

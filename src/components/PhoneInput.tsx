"use client";

import { useState, useEffect } from "react";
import { Phone } from "lucide-react";
import CountryCodeSelector from "./CountryCodeSelector";
import { countryCodes, type CountryCode } from "@/lib/countryCodes";
import { formatPhoneAsYouType, isValidPhoneNumber } from "@/lib/phoneFormatter";

interface PhoneInputProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
    placeholder?: string;
    required?: boolean;
}

export default function PhoneInput({
    value,
    onChange,
    className = "",
    placeholder = "Enter phone number",
    required = false
}: PhoneInputProps) {
    // Default to US
    const [selectedCountry, setSelectedCountry] = useState<CountryCode>(
        countryCodes.find(c => c.country === 'US') || countryCodes[0]
    );
    const [phoneNumber, setPhoneNumber] = useState("");
    const [isValid, setIsValid] = useState<boolean | null>(null);

    // Parse initial value if provided
    useEffect(() => {
        if (value && value.startsWith('+')) {
            // Try to extract country code from value
            const matchedCountry = countryCodes.find(c => value.startsWith(c.code));
            if (matchedCountry) {
                setSelectedCountry(matchedCountry);
                setPhoneNumber(value.substring(matchedCountry.code.length));
            }
        }
    }, [value]);

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value;

        // Format as user types
        const formatted = formatPhoneAsYouType(input, selectedCountry.country);
        setPhoneNumber(formatted);

        // Combine country code + number
        const fullNumber = selectedCountry.code + formatted.replace(/\s/g, '');
        onChange(fullNumber);

        // Validate
        if (formatted.length > 0) {
            setIsValid(isValidPhoneNumber(fullNumber, selectedCountry.country));
        } else {
            setIsValid(null);
        }
    };

    const handleCountryChange = (country: CountryCode) => {
        setSelectedCountry(country);

        // Update full number with new country code
        if (phoneNumber) {
            const fullNumber = country.code + phoneNumber.replace(/\s/g, '');
            onChange(fullNumber);
            setIsValid(isValidPhoneNumber(fullNumber, country.country));
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedText = e.clipboardData.getData('text');

        // Remove all non-digits
        const digitsOnly = pastedText.replace(/\D/g, '');

        // Format the pasted number
        const formatted = formatPhoneAsYouType(digitsOnly, selectedCountry.country);
        setPhoneNumber(formatted);

        const fullNumber = selectedCountry.code + formatted.replace(/\s/g, '');
        onChange(fullNumber);
        setIsValid(isValidPhoneNumber(fullNumber, selectedCountry.country));
    };

    return (
        <div className={className}>
            <div className="flex gap-2">
                {/* Country Code Selector */}
                <CountryCodeSelector
                    value={selectedCountry}
                    onChange={handleCountryChange}
                />

                {/* Phone Number Input */}
                <div className="flex-1 relative group">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-cyan-400 transition-colors" />
                    <input
                        type="tel"
                        value={phoneNumber}
                        onChange={handlePhoneChange}
                        onPaste={handlePaste}
                        className={`w-full pl-10 pr-4 py-3 bg-white/[0.03] border rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-cyan-400/50 focus:bg-white/[0.05] transition-all ${isValid === false
                                ? 'border-red-500/50'
                                : isValid === true
                                    ? 'border-green-500/50'
                                    : 'border-white/[0.08]'
                            }`}
                        placeholder={placeholder}
                        required={required}
                    />
                    {isValid === true && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 bg-green-400 rounded-full"></div>
                    )}
                    {isValid === false && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 bg-red-400 rounded-full"></div>
                    )}
                </div>
            </div>

            {/* Validation Message */}
            {isValid === false && phoneNumber.length > 0 && (
                <p className="text-xs text-red-400 mt-1.5">
                    Invalid phone number for {selectedCountry.name}
                </p>
            )}
            {isValid === true && (
                <p className="text-xs text-green-400 mt-1.5">
                    Valid phone number
                </p>
            )}
        </div>
    );
}

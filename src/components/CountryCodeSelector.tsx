"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Search, Check } from "lucide-react";
import { countryCodes, type CountryCode } from "@/lib/countryCodes";

interface CountryCodeSelectorProps {
    value: CountryCode;
    onChange: (country: CountryCode) => void;
    className?: string;
}

export default function CountryCodeSelector({ value, onChange, className = "" }: CountryCodeSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Filter countries based on search
    const filteredCountries = countryCodes.filter(country =>
        country.name.toLowerCase().includes(search.toLowerCase()) ||
        country.code.includes(search) ||
        country.country.toLowerCase().includes(search.toLowerCase())
    );

    const handleSelect = (country: CountryCode) => {
        onChange(country);
        setIsOpen(false);
        setSearch("");
    };

    return (
        <div ref={dropdownRef} className={`relative ${className}`}>
            {/* Selected Country Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white hover:bg-white/[0.05] focus:outline-none focus:border-cyan-400/50 transition-all"
            >
                <span className="text-lg">{value.flag}</span>
                <span className="text-sm font-mono">{value.code}</span>
                <ChevronDown className={`w-4 h-4 text-white/50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute z-50 mt-2 w-72 bg-zinc-900 border border-white/10 rounded-lg shadow-xl overflow-hidden"
                    >
                        {/* Search */}
                        <div className="p-3 border-b border-white/10">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search countries..."
                                    className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-400/50"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Country List */}
                        <div className="max-h-64 overflow-y-auto">
                            {filteredCountries.length > 0 ? (
                                filteredCountries.map((country) => (
                                    <button
                                        key={`${country.code}-${country.country}`}
                                        type="button"
                                        onClick={() => handleSelect(country)}
                                        className={`w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/5 transition-colors ${value.code === country.code && value.country === country.country
                                                ? 'bg-cyan-500/10 text-cyan-400'
                                                : 'text-white'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg">{country.flag}</span>
                                            <div className="text-left">
                                                <div className="text-sm font-medium">{country.name}</div>
                                                <div className="text-xs text-white/50 font-mono">{country.code}</div>
                                            </div>
                                        </div>
                                        {value.code === country.code && value.country === country.country && (
                                            <Check className="w-4 h-4 text-cyan-400" />
                                        )}
                                    </button>
                                ))
                            ) : (
                                <div className="px-4 py-8 text-center text-white/50 text-sm">
                                    No countries found
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

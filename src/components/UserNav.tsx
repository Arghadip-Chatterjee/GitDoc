"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { User, LogOut, LayoutDashboard, Shield } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function UserNav() {
    const { data: session, status } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (status === "loading") {
        return (
            <div className="w-8 h-8 rounded-full bg-neutral-700 animate-pulse"></div>
        );
    }

    if (!session) {
        return (
            <div className="flex gap-3">
                <Link
                    href="/auth/signin"
                    className="px-4 py-2 text-neutral-300 hover:text-white transition-colors"
                >
                    Sign In
                </Link>
                <Link
                    href="/auth/signup"
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                    Sign Up
                </Link>
            </div>
        );
    }

    const user = session.user as any;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-neutral-800 transition-colors"
            >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-semibold">
                    {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
                </div>
                <span className="text-neutral-200 hidden sm:block">{user.name || user.email}</span>
                {user.isAdmin && (
                    <Shield className="w-4 h-4 text-yellow-500" />
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl py-2 z-50">
                    <div className="px-4 py-2 border-b border-neutral-700">
                        <p className="text-sm font-medium text-white">{user.name || "User"}</p>
                        <p className="text-xs text-neutral-400 truncate">{user.email}</p>
                        {user.isAdmin && (
                            <span className="inline-flex items-center gap-1 mt-1 text-xs text-yellow-500">
                                <Shield className="w-3 h-3" />
                                Administrator
                            </span>
                        )}
                    </div>

                    <Link
                        href="/dashboard"
                        className="flex items-center gap-2 px-4 py-2 text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
                        onClick={() => setIsOpen(false)}
                    >
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                    </Link>

                    {user.isAdmin && (
                        <Link
                            href="/admin"
                            className="flex items-center gap-2 px-4 py-2 text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            <Shield className="w-4 h-4" />
                            Admin Panel
                        </Link>
                    )}

                    <button
                        onClick={() => {
                            setIsOpen(false);
                            signOut({ callbackUrl: "/" });
                        }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-red-400 hover:bg-neutral-800 transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            )}
        </div>
    );
}

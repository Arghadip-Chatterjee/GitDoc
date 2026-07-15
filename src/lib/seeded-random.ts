/** Deterministic 0–1 value; stable across SSR and client hydration. */
export function seededRandom(seed: number, salt = 0): number {
    const x = Math.sin((seed + 1) * (9999 + salt * 123)) * 10000;
    return x - Math.floor(x);
}

export function seededFloat(seed: number, min: number, max: number, salt = 0): number {
    return min + seededRandom(seed, salt) * (max - min);
}

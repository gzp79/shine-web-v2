import clsx, { type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

const twMerge = extendTailwindMerge({
    extend: {
        classGroups: {
            brightness: [{ brightness: ['highlight'] }],
            'backdrop-brightness': [{ 'backdrop-brightness': ['highlight'] }]
        }
    }
});

export function cn(...inputs: ClassValue[]): string {
    return twMerge(clsx(inputs));
}

export function shortenString(str: string, maxLength: number): string {
    if (str.length <= maxLength) return str;
    const half = Math.floor((maxLength - 3) / 2);
    return `${str.slice(0, half)}...${str.slice(str.length - half)}`;
}

export function range(start: number, end: number): number[] {
    return Array.from({ length: end - start }, (_, i) => start + i);
}

export function simpleHash(str: string): string {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = (hash * 33) ^ str.charCodeAt(i);
    }
    return (hash >>> 0).toString(16);
}

export * from './_context';
export * from './_binding.ts';
export * from './_event_helpers';

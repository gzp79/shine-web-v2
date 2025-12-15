import clsx, { type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
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

export { createContext } from './_context';

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function getImageUrl(url: string | undefined | null) {
    if (!url) return undefined
    if (url.startsWith('http')) return url
    return url
}

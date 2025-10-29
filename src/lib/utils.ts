import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from "svelte-sonner";
import { page } from "$app/state";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, "child"> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, "children"> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };

/**
 * Handles form message notifications by displaying appropriate toast messages.
 * Should be called in a $effect block in the component.
 * 
 * @param message - The form message store value
 * @returns void
 */
export function handleFormMessage(message: string | undefined) {
    if (message) {
        if (page.status >= 200 && page.status < 300) {
            toast.success(message);
        } else {
            toast.error(message);
        }
    }
}

import * as dateUtils from "$lib/utils/date";
import { CalendarDate } from "@internationalized/date";
import { randomBytes } from "crypto";

export function generateSecret(length: number = 32): string {
    return randomBytes(length).toString("base64");
}

export function getSeasonAndYear(dateString: string): string {
    return dateUtils.getSeasonAndYear(dateString);
}

export function flattenObject<T>(data: T): Record<string, unknown> {
    const flattened: Record<string, unknown> = {};

    function _flatten(obj: unknown, parentKey: string = ""): void {
        // Case 1: The object is an array
        if (Array.isArray(obj)) {
            // If the array is empty, represent it with the parent key
            if (obj.length === 0 && parentKey) {
                flattened[parentKey] = [];
                return;
            }
            obj.forEach((item, i: number) => {
                // Construct the new key with the index
                const newKey = `${parentKey}[${i}]`;
                // Recurse into the array item
                _flatten(item, newKey);
            });
        }
        // Case 2: The object is a non-null object
        else if (typeof obj === "object" && obj !== null) {
            const keys = Object.keys(obj as object);
            // If the object is empty, represent it with the parent key
            if (keys.length === 0 && parentKey) {
                flattened[parentKey] = {};
                return;
            }
            keys.forEach((key) => {
                // Construct the new key. If there's no parent, the key is just the current key.
                const newKey = parentKey ? `${parentKey}.${key}` : key;
                // Recurse into the value
                _flatten((obj as Record<string, unknown>)[key], newKey);
            });
        }
        // Case 3: The object is a primitive type (or we treat it as one)
        else {
            // This is the base case for the recursion
            if (parentKey) {
                flattened[parentKey] = obj;
            }
        }
    }

    // Start the recursion with the initial data
    _flatten(data);

    return flattened;
}

export function calculateAge(
    birthday: string | null,
    deathday: string | null = null
): number | null {
    return dateUtils.calculateAge(birthday, deathday);
}

export const formatBytes = (bytes: number | null | undefined): string => {
    if (bytes === null || bytes === undefined) return "N/A";
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export function formatDate(dateStr: string | null): string | null {
    return dateUtils.formatDate(dateStr);
}

export function isDayAndMonthToday(dateStr: string | null): boolean {
    return dateUtils.isDayAndMonthToday(dateStr);
}

export const getServiceDisplayName = (service: string): string => {
    switch (service.toLowerCase()) {
        case "realdebrid":
            return "Real-Debrid";
        case "torbox":
            return "TorBox";
        case "alldebrid":
            return "AllDebrid";
        default:
            return service;
    }
};

export const getLastMonday = (date: { year: number; month: number; day: number }) => {
    const calendarDate = new CalendarDate(date.year, date.month, date.day);
    return dateUtils.getLastMonday(calendarDate);
};

export const getColor = (colors: string[], max: number, value: number) => {
    if (!value) return colors[0];
    const p = (value / max) * (colors.length - 1);
    return colors[Math.ceil(p)];
};

export const getCalendar = (data: { [key: string]: number }, year: number) => {
    return dateUtils.getCalendar(data, year);
};

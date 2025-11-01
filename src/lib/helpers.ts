export function getSeasonAndYear(dateString: string): string {
    if (!dateString) return "TBA";

    const date = new Date(dateString);
    const month = date.getMonth();
    const year = date.getFullYear();

    let season;
    if (month >= 2 && month <= 4) {
        season = "Spring";
    } else if (month >= 5 && month <= 7) {
        season = "Summer";
    } else if (month >= 8 && month <= 10) {
        season = "Fall";
    } else {
        season = "Winter";
    }

    return `${season} ${year}`;
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
    if (!birthday) return null;
    const birthDate = new Date(birthday);
    const endDate = deathday ? new Date(deathday) : new Date();
    let age = endDate.getFullYear() - birthDate.getFullYear();
    const monthDiff = endDate.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && endDate.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
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
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

function isSameDayAndMonth(date1: Date, date2: Date): boolean {
    return date1.getMonth() === date2.getMonth() && date1.getDate() === date2.getDate();
}

export function isDayAndMonthToday(dateStr: string | null): boolean {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const today = new Date();
    return isSameDayAndMonth(date, today);
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

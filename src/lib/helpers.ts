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

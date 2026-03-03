/**
 * Normalize a title for comparison — lowercase and strip non-alphanumeric (unicode-aware).
 */
export function normalizeTitle(s: string): string {
    return s
        .toLowerCase()
        .replace(/[^\p{L}\p{N} ]/gu, "")
        .trim();
}

/**
 * Calculates the Levenshtein distance between two strings.
 */
export function levenshtein(s1: string, s2: string): number {
    const m = s1.length;
    const n = s2.length;
    const d: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) d[i][0] = i;
    for (let j = 0; j <= n; j++) d[0][j] = j;

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
            d[i][j] = Math.min(
                d[i - 1][j] + 1, // deletion
                d[i][j - 1] + 1, // insertion
                d[i - 1][j - 1] + cost // substitution
            );
        }
    }

    return d[m][n];
}

/**
 * Calculates the similarity between two strings as a percentage (0 to 1).
 * Uses normalizeTitle for unicode-aware comparison (strips punctuation/special chars).
 */
export function calculateSimilarity(s1: string, s2: string): number {
    const str1 = normalizeTitle(s1);
    const str2 = normalizeTitle(s2);

    if (str1 === str2) return 1;
    if (str1.length === 0 || str2.length === 0) return 0;

    const distance = levenshtein(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);

    return 1 - distance / maxLength;
}

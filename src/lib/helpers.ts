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

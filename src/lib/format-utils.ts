export const formatBytes = (bytes: number | null | undefined): string => {
    if (bytes === null || bytes === undefined) return "N/A";
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString(navigator.language, {
        year: "numeric",
        month: "long",
        day: "numeric"
    });
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
}
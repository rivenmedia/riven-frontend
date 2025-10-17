export const doesBrowserSupportPasskeys = (): boolean => {
    return typeof window !== "undefined" && !!window.PublicKeyCredential;
};

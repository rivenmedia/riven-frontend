// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare const __APP_VERSION__: string;

declare global {
    namespace App {
        interface Locals {
            user: import("$lib/server/auth").SessionValidationResult["user"];
            session: import("$lib/server/auth").SessionValidationResult["session"];
            backendUrl: string;
            apiKey: string;
        }
    }
}

export {};

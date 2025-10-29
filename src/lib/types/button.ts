/**
 * Common button variant types used across the application
 */
export type ButtonVariant =
    | "ghost"
    | "default"
    | "link"
    | "destructive"
    | "outline"
    | "secondary"
    | undefined;

/**
 * Common button size types used across the application
 */
export type ButtonSize = "default" | "sm" | "lg" | "icon" | "icon-sm" | "icon-lg" | undefined;

/**
 * Common props for components that wrap buttons
 */
export interface ButtonWrapperProps {
    variant?: ButtonVariant;
    size?: ButtonSize;
    class?: string;
}

import { env } from "$env/dynamic/private";
import { randomBytes } from "crypto";

export interface PlexPin {
	id: number;
	code: string;
	product: string;
	trusted: boolean;
	clientIdentifier: string;
	location: {
		code: string;
		european_union_member: boolean;
		continent_code: string;
		country: string;
		city: string;
		time_zone: string;
		postal_code: string;
		in_privacy_restricted_country: boolean;
		subdivisions: string;
		coordinates: string;
	};
	expiresIn: number;
	createdAt: string;
	expiresAt: string;
	authToken: string | null;
	newRegistration: boolean | null;
}

export interface PlexUser {
	id: number;
	uuid: string;
	username: string;
	title: string;
	email: string;
	friendlyName: string;
	locale: string | null;
	confirmed: boolean;
	joinedAt: string;
	emailOnlyAuth: boolean;
	hasPassword: boolean;
	protected: boolean;
	thumb: string;
	authToken: string;
	mailingListStatus: string;
	mailingListActive: boolean;
	scrobbleTypes: string;
	country: string;
	subscription: {
		active: boolean;
		subscribedAt: string;
		status: string;
		paymentService: string;
		plan: string;
		features: string[];
	};
	subscriptionDescription: string;
	restricted: boolean;
	anonymous: boolean | null;
	home: boolean;
	guest: boolean;
	homeSize: number;
	homeAdmin: boolean;
	maxHomeSize: number;
	rememberExpiresAt: string;
	profile: {
		autoSelectAudio: boolean;
		defaultAudioLanguage: string;
		defaultSubtitleLanguage: string;
		autoSelectSubtitle: number;
		defaultSubtitleAccessibility: number;
		defaultSubtitleForced: number;
		watchedIndicator: number;
		mediaReviewsVisibility: number;
	};
	entitlements: string[];
	roles: string[];
	services: Array<{
		identifier: string;
		endpoint: string;
		token: string | null;
		secret: string | null;
		status: string;
	}>;
	adsConsent: boolean | null;
	adsConsentSetAt: number | null;
	adsConsentReminderAt: number | null;
	experimentalFeatures: boolean;
	twoFactorEnabled: boolean;
	backupCodesCreated: boolean;
}

const PLEX_API_URL = "https://plex.tv/api/v2";
const PLEX_AUTH_URL = "https://app.plex.tv/auth";

/**
 * Generate a unique client identifier for Plex OAuth
 */
export function generateClientIdentifier(): string {
	return env.PLEX_CLIENT_IDENTIFIER || randomBytes(16).toString("hex");
}

/**
 * Get the product name for Plex OAuth
 */
export function getProductName(): string {
	return env.PLEX_PRODUCT_NAME || "Riven Media";
}

/**
 * Request a PIN from Plex for OAuth authentication
 */
export async function requestPlexPin(clientIdentifier: string): Promise<PlexPin> {
	const productName = getProductName();
	const params = new URLSearchParams({
		strong: "true",
		"X-Plex-Product": productName,
		"X-Plex-Client-Identifier": clientIdentifier
	});

	const response = await fetch(`${PLEX_API_URL}/pins?${params.toString()}`, {
		method: "POST",
		headers: {
			accept: "application/json"
		}
	});

	if (!response.ok) {
		throw new Error(`Failed to request Plex PIN: ${response.statusText}`);
	}

	const data = await response.json();
	return data;
}

/**
 * Check the status of a PIN and retrieve the auth token if available
 */
export async function checkPlexPinStatus(
	pinId: number,
	clientIdentifier: string
): Promise<PlexPin> {
	const response = await fetch(`${PLEX_API_URL}/pins/${pinId}`, {
		method: "GET",
		headers: {
			accept: "application/json",
			"X-Plex-Client-Identifier": clientIdentifier
		}
	});

	if (!response.ok) {
		throw new Error(`Failed to check Plex PIN status: ${response.statusText}`);
	}

	const data = await response.json();
	return data;
}

/**
 * Get Plex user information using an auth token
 */
export async function getPlexUser(authToken: string): Promise<PlexUser> {
	const response = await fetch(`${PLEX_API_URL}/user`, {
		method: "GET",
		headers: {
			accept: "application/json",
			"X-Plex-Token": authToken
		}
	});

	if (!response.ok) {
		if (response.status === 401) {
			throw new Error("Invalid Plex auth token");
		}
		throw new Error(`Failed to get Plex user: ${response.statusText}`);
	}

	const data = await response.json();
	return data;
}

/**
 * Construct the Plex OAuth URL for user authorization
 */
export function getPlexAuthUrl(
	code: string,
	clientIdentifier: string,
	forwardUrl: string
): string {
	const productName = getProductName();
	const params = new URLSearchParams({
		clientID: clientIdentifier,
		code: code,
		"context[device][product]": productName,
		forwardUrl: forwardUrl
	});

	return `${PLEX_AUTH_URL}#?${params.toString()}`;
}

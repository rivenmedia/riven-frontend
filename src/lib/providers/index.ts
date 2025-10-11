/*
TMDB V3 OPENAPI SPEC: https://developer.themoviedb.org/openapi/64542913e1f86100738e227f
TVDB V4 OPENAPI SPEC: https://thetvdb.github.io/v4-api/swagger.yml

COMMAND TO GENERATE: pnpx openapi-typescript URL -o src/lib/providers/FILE.ts

This is different from @hey-api openapi-ts package.
*/

import createClient from "openapi-fetch";
import { env } from "$env/dynamic/public";

import type { paths as TVDBPaths } from "./tvdb";
import type { paths as TMDBPaths } from "./tmdb";
import { parseTMDBMovieDetails } from "./parser";

const tvdbClient = createClient<TVDBPaths>({
    baseUrl: "https://api4.thetvdb.com/v4"
});

const TMDB_READ_ACCESS_TOKEN =
    env.PUBLIC_TMDB_READ_ACCESS_TOKEN ||
    "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJlNTkxMmVmOWFhM2IxNzg2Zjk3ZTE1NWY1YmQ3ZjY1MSIsInN1YiI6IjY1M2NjNWUyZTg5NGE2MDBmZjE2N2FmYyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.xrIXsMFJpI1o1j5g2QpQcFP1X3AfRjFA5FlBFO5Naw8";
const tmdbClient = createClient<TMDBPaths>({
    baseUrl: "https://api.themoviedb.org",
    headers: {
        Authorization: `Bearer ${TMDB_READ_ACCESS_TOKEN}`,
        "Content-Type": "application/json;charset=utf-8"
    }
});

export const TVDB_ARTWORK_BASE_URL = "https://artworks.thetvdb.com";
export const TVDB_ARTWORK_STATUSES = {
    1: "Low Quality",
    2: "Improper Action Shot",
    3: "Spoiler",
    4: "Adult Content",
    5: "Automatically Resized"
};
export const TVDB_ARTWORK_TYPES = {
    1: {
        name: "Banner",
        recordType: "series",
        imageFormat: "JPG",
        width: 758,
        height: 140,
        thumbWidth: 758,
        thumbHeight: 140
    },
    2: {
        name: "Poster",
        recordType: "series",
        imageFormat: "JPG",
        width: 680,
        height: 1000,
        thumbWidth: 340,
        thumbHeight: 500
    },
    3: {
        name: "Background",
        recordType: "series",
        imageFormat: "JPG",
        width: 1920,
        height: 1080,
        thumbWidth: 640,
        thumbHeight: 360
    },
    5: {
        name: "Icon",
        recordType: "series",
        imageFormat: "PNG",
        width: 1024,
        height: 1024,
        thumbWidth: 512,
        thumbHeight: 512
    },
    6: {
        name: "Banner",
        recordType: "season",
        imageFormat: "JPG",
        width: 758,
        height: 140,
        thumbWidth: 758,
        thumbHeight: 140
    },
    7: {
        name: "Poster",
        recordType: "season",
        imageFormat: "JPG",
        width: 680,
        height: 1000,
        thumbWidth: 340,
        thumbHeight: 500
    },
    8: {
        name: "Background",
        recordType: "season",
        imageFormat: "JPG",
        width: 1920,
        height: 1080,
        thumbWidth: 640,
        thumbHeight: 360
    },
    10: {
        name: "Icon",
        recordType: "season",
        imageFormat: "PNG",
        width: 1024,
        height: 1024,
        thumbWidth: 512,
        thumbHeight: 512
    },
    11: {
        name: "16:9 Screencap",
        recordType: "episode",
        imageFormat: "JPG",
        width: 640,
        height: 360,
        thumbWidth: 640,
        thumbHeight: 360
    },
    12: {
        name: "4:3 Screencap",
        recordType: "episode",
        imageFormat: "JPG",
        width: 640,
        height: 480,
        thumbWidth: 640,
        thumbHeight: 480
    },
    13: {
        name: "Photo",
        recordType: "actor",
        imageFormat: "JPG",
        width: 300,
        height: 450,
        thumbWidth: 300,
        thumbHeight: 450
    },
    14: {
        name: "Poster",
        recordType: "movie",
        imageFormat: "JPG",
        width: 680,
        height: 1000,
        thumbWidth: 340,
        thumbHeight: 500
    },
    15: {
        name: "Background",
        recordType: "movie",
        imageFormat: "JPG",
        width: 1920,
        height: 1080,
        thumbWidth: 640,
        thumbHeight: 360
    },
    16: {
        name: "Banner",
        recordType: "movie",
        imageFormat: "JPG",
        width: 758,
        height: 140,
        thumbWidth: 758,
        thumbHeight: 140
    },
    18: {
        name: "Icon",
        recordType: "movie",
        imageFormat: "PNG",
        width: 1024,
        height: 1024,
        thumbWidth: 512,
        thumbHeight: 512
    },
    19: {
        name: "Icon",
        recordType: "company",
        imageFormat: "PNG",
        width: 512,
        height: 512,
        thumbWidth: 256,
        thumbHeight: 256
    },
    20: {
        name: "Cinemagraph",
        recordType: "series",
        imageFormat: "MP4",
        width: 1280,
        height: 720,
        thumbWidth: 1280,
        thumbHeight: 720
    },
    21: {
        name: "Cinemagraph",
        recordType: "movie",
        imageFormat: "MP4",
        width: 1280,
        height: 720,
        thumbWidth: 1280,
        thumbHeight: 720
    },
    22: {
        name: "ClearArt",
        recordType: "series",
        imageFormat: "PNG",
        width: 1000,
        height: 562,
        thumbWidth: 500,
        thumbHeight: 281
    },
    23: {
        name: "ClearLogo",
        recordType: "series",
        imageFormat: "PNG",
        width: 800,
        height: 310,
        thumbWidth: 400,
        thumbHeight: 155
    },
    24: {
        name: "ClearArt",
        recordType: "movie",
        imageFormat: "PNG",
        width: 1000,
        height: 562,
        thumbWidth: 500,
        thumbHeight: 281
    },
    25: {
        name: "ClearLogo",
        recordType: "movie",
        imageFormat: "PNG",
        width: 800,
        height: 310,
        thumbWidth: 400,
        thumbHeight: 155
    },
    26: {
        name: "Icon",
        recordType: "award",
        imageFormat: "PNG",
        width: 1024,
        height: 1024,
        thumbWidth: 512,
        thumbHeight: 512
    },
    27: {
        name: "Poster",
        recordType: "list",
        imageFormat: "JPG",
        width: 680,
        height: 1000,
        thumbWidth: 340,
        thumbHeight: 500
    }
};
export const TVDB_AWARDS = {
    1: "Academy Awards",
    2: "Golden Globe Awards",
    3: "MTV Movie & TV Awards",
    4: "Critics' Choice Awards",
    5: "Primetime Emmy Awards",
    6: "Screen Actors Guild Awards",
    7: "Writers Guild of America Awards",
    8: "Producers Guild of America Awards",
    9: "Directors Guild of America Awards",
    10: "Daytime Emmy Awards",
    11: "BAFTA Awards",
    12: "Bijou Awards",
    13: "Canadian Film Awards",
    14: "Genie Awards",
    15: "Gemini Awards",
    16: "Canadian Screen Awards",
    17: "International Emmy Awards",
    18: "National Television Awards",
    19: "César Awards",
    21: "Baeksang Arts Awards"
};
export const TVDB_COMPANY_TYPES = {
    1: "Network",
    2: "Studio",
    3: "Production Company",
    4: "Distributor",
    5: "Special Effects"
};
export const TVDB_ENTITY_TYPES = {
    1: "series",
    2: "season",
    3: "episode",
    4: "movie",
    5: "person",
    6: "artwork",
    7: "character",
    8: "company",
    9: "list"
};
export const TVDB_GENRES = {
    1: { name: "Soap", slug: "soap" },
    2: { name: "Science Fiction", slug: "science-fiction" },
    3: { name: "Reality", slug: "reality" },
    4: { name: "News", slug: "news" },
    5: { name: "Mini-Series", slug: "mini-series" },
    6: { name: "Horror", slug: "horror" },
    7: { name: "Home and Garden", slug: "home-and-garden" },
    8: { name: "Game Show", slug: "game-show" },
    9: { name: "Food", slug: "food" },
    10: { name: "Fantasy", slug: "fantasy" },
    11: { name: "Family", slug: "family" },
    12: { name: "Drama", slug: "drama" },
    13: { name: "Documentary", slug: "documentary" },
    14: { name: "Crime", slug: "crime" },
    15: { name: "Comedy", slug: "comedy" },
    16: { name: "Children", slug: "children" },
    17: { name: "Animation", slug: "animation" },
    18: { name: "Adventure", slug: "adventure" },
    19: { name: "Action", slug: "action" },
    21: { name: "Sport", slug: "sport" },
    22: { name: "Suspense", slug: "suspense" },
    23: { name: "Talk Show", slug: "talk-show" },
    24: { name: "Thriller", slug: "thriller" },
    25: { name: "Travel", slug: "travel" },
    26: { name: "Western", slug: "western" },
    27: { name: "Anime", slug: "anime" },
    28: { name: "Romance", slug: "romance" },
    29: { name: "Musical", slug: "musical" },
    30: { name: "Podcast", slug: "podcast" },
    31: { name: "Mystery", slug: "mystery" },
    32: { name: "Indie", slug: "indie" },
    33: { name: "History", slug: "history" },
    34: { name: "War", slug: "war" },
    35: { name: "Martial Arts", slug: "martial-arts" },
    36: { name: "Awards Show", slug: "awards-show" }
};

export const TMDB_BASE_URL: string = "https://api.themoviedb.org/3";
export const TMDB_IMAGE_BASE_URL: string = "https://image.tmdb.org/t/p";
export enum TMDBMediaType {
    All = "all",
    Movie = "movie",
    TV = "tv",
    Person = "person"
}
export enum TMDBTimeWindow {
    Day = "day",
    Week = "week"
}
export const TMDB_GENRES: Record<number, string> = {
    28: "Action",
    12: "Adventure",
    16: "Animation",
    35: "Comedy",
    80: "Crime",
    99: "Documentary",
    18: "Drama",
    10751: "Family",
    14: "Fantasy",
    36: "History",
    27: "Horror",
    10402: "Music",
    9648: "Mystery",
    10749: "Romance",
    878: "Science Fiction",
    10770: "TV Movie",
    53: "Thriller",
    10752: "War",
    37: "Western",
    10759: "Action & Adventure",
    10762: "Kids",
    10763: "News",
    10764: "Reality",
    10765: "Sci-Fi & Fantasy",
    10766: "Soap",
    10767: "Talk",
    10768: "War & Politics"
};

export const TMDB_LANGUAGES: { iso_639_1: string; english_name: string; name: string }[] = [
    {
        iso_639_1: "xx",
        english_name: "No Language",
        name: "No Language"
    },
    {
        iso_639_1: "aa",
        english_name: "Afar",
        name: ""
    },
    {
        iso_639_1: "af",
        english_name: "Afrikaans",
        name: "Afrikaans"
    },
    {
        iso_639_1: "ak",
        english_name: "Akan",
        name: ""
    },
    {
        iso_639_1: "an",
        english_name: "Aragonese",
        name: ""
    },
    {
        iso_639_1: "as",
        english_name: "Assamese",
        name: ""
    },
    {
        iso_639_1: "av",
        english_name: "Avaric",
        name: ""
    },
    {
        iso_639_1: "ae",
        english_name: "Avestan",
        name: ""
    },
    {
        iso_639_1: "ay",
        english_name: "Aymara",
        name: ""
    },
    {
        iso_639_1: "az",
        english_name: "Azerbaijani",
        name: "Azərbaycan"
    },
    {
        iso_639_1: "ba",
        english_name: "Bashkir",
        name: ""
    },
    {
        iso_639_1: "bm",
        english_name: "Bambara",
        name: "Bamanankan"
    },
    {
        iso_639_1: "bn",
        english_name: "Bengali",
        name: "বাংলা"
    },
    {
        iso_639_1: "bi",
        english_name: "Bislama",
        name: ""
    },
    {
        iso_639_1: "bo",
        english_name: "Tibetan",
        name: ""
    },
    {
        iso_639_1: "bs",
        english_name: "Bosnian",
        name: "Bosanski"
    },
    {
        iso_639_1: "br",
        english_name: "Breton",
        name: ""
    },
    {
        iso_639_1: "ca",
        english_name: "Catalan",
        name: "Català"
    },
    {
        iso_639_1: "cs",
        english_name: "Czech",
        name: "Český"
    },
    {
        iso_639_1: "ch",
        english_name: "Chamorro",
        name: "Finu' Chamorro"
    },
    {
        iso_639_1: "ce",
        english_name: "Chechen",
        name: ""
    },
    {
        iso_639_1: "cu",
        english_name: "Slavic",
        name: ""
    },
    {
        iso_639_1: "cv",
        english_name: "Chuvash",
        name: ""
    },
    {
        iso_639_1: "kw",
        english_name: "Cornish",
        name: ""
    },
    {
        iso_639_1: "co",
        english_name: "Corsican",
        name: ""
    },
    {
        iso_639_1: "cr",
        english_name: "Cree",
        name: ""
    },
    {
        iso_639_1: "cy",
        english_name: "Welsh",
        name: "Cymraeg"
    },
    {
        iso_639_1: "da",
        english_name: "Danish",
        name: "Dansk"
    },
    {
        iso_639_1: "de",
        english_name: "German",
        name: "Deutsch"
    },
    {
        iso_639_1: "dv",
        english_name: "Divehi",
        name: ""
    },
    {
        iso_639_1: "dz",
        english_name: "Dzongkha",
        name: ""
    },
    {
        iso_639_1: "en",
        english_name: "English",
        name: "English"
    },
    {
        iso_639_1: "eo",
        english_name: "Esperanto",
        name: "Esperanto"
    },
    {
        iso_639_1: "et",
        english_name: "Estonian",
        name: "Eesti"
    },
    {
        iso_639_1: "eu",
        english_name: "Basque",
        name: "euskera"
    },
    {
        iso_639_1: "fo",
        english_name: "Faroese",
        name: ""
    },
    {
        iso_639_1: "fj",
        english_name: "Fijian",
        name: ""
    },
    {
        iso_639_1: "fi",
        english_name: "Finnish",
        name: "suomi"
    },
    {
        iso_639_1: "fr",
        english_name: "French",
        name: "Français"
    },
    {
        iso_639_1: "fy",
        english_name: "Frisian",
        name: ""
    },
    {
        iso_639_1: "ff",
        english_name: "Fulah",
        name: "Fulfulde"
    },
    {
        iso_639_1: "gd",
        english_name: "Gaelic",
        name: ""
    },
    {
        iso_639_1: "ga",
        english_name: "Irish",
        name: "Gaeilge"
    },
    {
        iso_639_1: "gl",
        english_name: "Galician",
        name: "Galego"
    },
    {
        iso_639_1: "gv",
        english_name: "Manx",
        name: ""
    },
    {
        iso_639_1: "gn",
        english_name: "Guarani",
        name: ""
    },
    {
        iso_639_1: "gu",
        english_name: "Gujarati",
        name: ""
    },
    {
        iso_639_1: "ht",
        english_name: "Haitian; Haitian Creole",
        name: ""
    },
    {
        iso_639_1: "ha",
        english_name: "Hausa",
        name: "Hausa"
    },
    {
        iso_639_1: "sh",
        english_name: "Serbo-Croatian",
        name: ""
    },
    {
        iso_639_1: "hz",
        english_name: "Herero",
        name: ""
    },
    {
        iso_639_1: "ho",
        english_name: "Hiri Motu",
        name: ""
    },
    {
        iso_639_1: "hr",
        english_name: "Croatian",
        name: "Hrvatski"
    },
    {
        iso_639_1: "hu",
        english_name: "Hungarian",
        name: "Magyar"
    },
    {
        iso_639_1: "ig",
        english_name: "Igbo",
        name: ""
    },
    {
        iso_639_1: "io",
        english_name: "Ido",
        name: ""
    },
    {
        iso_639_1: "ii",
        english_name: "Yi",
        name: ""
    },
    {
        iso_639_1: "iu",
        english_name: "Inuktitut",
        name: ""
    },
    {
        iso_639_1: "ie",
        english_name: "Interlingue",
        name: ""
    },
    {
        iso_639_1: "ia",
        english_name: "Interlingua",
        name: ""
    },
    {
        iso_639_1: "id",
        english_name: "Indonesian",
        name: "Bahasa indonesia"
    },
    {
        iso_639_1: "ik",
        english_name: "Inupiaq",
        name: ""
    },
    {
        iso_639_1: "is",
        english_name: "Icelandic",
        name: "Íslenska"
    },
    {
        iso_639_1: "it",
        english_name: "Italian",
        name: "Italiano"
    },
    {
        iso_639_1: "jv",
        english_name: "Javanese",
        name: ""
    },
    {
        iso_639_1: "ja",
        english_name: "Japanese",
        name: "日本語"
    },
    {
        iso_639_1: "kl",
        english_name: "Kalaallisut",
        name: ""
    },
    {
        iso_639_1: "kn",
        english_name: "Kannada",
        name: "?????"
    },
    {
        iso_639_1: "ks",
        english_name: "Kashmiri",
        name: ""
    },
    {
        iso_639_1: "ka",
        english_name: "Georgian",
        name: "ქართული"
    },
    {
        iso_639_1: "kr",
        english_name: "Kanuri",
        name: ""
    },
    {
        iso_639_1: "kk",
        english_name: "Kazakh",
        name: "қазақ"
    },
    {
        iso_639_1: "km",
        english_name: "Khmer",
        name: ""
    },
    {
        iso_639_1: "ki",
        english_name: "Kikuyu",
        name: ""
    },
    {
        iso_639_1: "rw",
        english_name: "Kinyarwanda",
        name: "Kinyarwanda"
    },
    {
        iso_639_1: "ky",
        english_name: "Kirghiz",
        name: "??????"
    },
    {
        iso_639_1: "kv",
        english_name: "Komi",
        name: ""
    },
    {
        iso_639_1: "kg",
        english_name: "Kongo",
        name: ""
    },
    {
        iso_639_1: "ko",
        english_name: "Korean",
        name: "한국어/조선말"
    },
    {
        iso_639_1: "kj",
        english_name: "Kuanyama",
        name: ""
    },
    {
        iso_639_1: "ku",
        english_name: "Kurdish",
        name: ""
    },
    {
        iso_639_1: "lo",
        english_name: "Lao",
        name: ""
    },
    {
        iso_639_1: "la",
        english_name: "Latin",
        name: "Latin"
    },
    {
        iso_639_1: "lv",
        english_name: "Latvian",
        name: "Latviešu"
    },
    {
        iso_639_1: "li",
        english_name: "Limburgish",
        name: ""
    },
    {
        iso_639_1: "ln",
        english_name: "Lingala",
        name: ""
    },
    {
        iso_639_1: "lt",
        english_name: "Lithuanian",
        name: "Lietuvių"
    },
    {
        iso_639_1: "lb",
        english_name: "Letzeburgesch",
        name: ""
    },
    {
        iso_639_1: "lu",
        english_name: "Luba-Katanga",
        name: ""
    },
    {
        iso_639_1: "lg",
        english_name: "Ganda",
        name: ""
    },
    {
        iso_639_1: "mh",
        english_name: "Marshall",
        name: ""
    },
    {
        iso_639_1: "ml",
        english_name: "Malayalam",
        name: ""
    },
    {
        iso_639_1: "mr",
        english_name: "Marathi",
        name: ""
    },
    {
        iso_639_1: "mg",
        english_name: "Malagasy",
        name: ""
    },
    {
        iso_639_1: "mt",
        english_name: "Maltese",
        name: "Malti"
    },
    {
        iso_639_1: "mo",
        english_name: "Moldavian",
        name: ""
    },
    {
        iso_639_1: "mn",
        english_name: "Mongolian",
        name: ""
    },
    {
        iso_639_1: "mi",
        english_name: "Maori",
        name: ""
    },
    {
        iso_639_1: "ms",
        english_name: "Malay",
        name: "Bahasa melayu"
    },
    {
        iso_639_1: "my",
        english_name: "Burmese",
        name: ""
    },
    {
        iso_639_1: "na",
        english_name: "Nauru",
        name: ""
    },
    {
        iso_639_1: "nv",
        english_name: "Navajo",
        name: ""
    },
    {
        iso_639_1: "nr",
        english_name: "Ndebele",
        name: ""
    },
    {
        iso_639_1: "nd",
        english_name: "Ndebele",
        name: ""
    },
    {
        iso_639_1: "ng",
        english_name: "Ndonga",
        name: ""
    },
    {
        iso_639_1: "ne",
        english_name: "Nepali",
        name: ""
    },
    {
        iso_639_1: "nl",
        english_name: "Dutch",
        name: "Nederlands"
    },
    {
        iso_639_1: "nn",
        english_name: "Norwegian Nynorsk",
        name: ""
    },
    {
        iso_639_1: "nb",
        english_name: "Norwegian Bokmål",
        name: "Bokmål"
    },
    {
        iso_639_1: "no",
        english_name: "Norwegian",
        name: "Norsk"
    },
    {
        iso_639_1: "ny",
        english_name: "Chichewa; Nyanja",
        name: ""
    },
    {
        iso_639_1: "oc",
        english_name: "Occitan",
        name: ""
    },
    {
        iso_639_1: "oj",
        english_name: "Ojibwa",
        name: ""
    },
    {
        iso_639_1: "or",
        english_name: "Oriya",
        name: ""
    },
    {
        iso_639_1: "om",
        english_name: "Oromo",
        name: ""
    },
    {
        iso_639_1: "os",
        english_name: "Ossetian; Ossetic",
        name: ""
    },
    {
        iso_639_1: "pa",
        english_name: "Punjabi",
        name: "ਪੰਜਾਬੀ"
    },
    {
        iso_639_1: "pi",
        english_name: "Pali",
        name: ""
    },
    {
        iso_639_1: "pl",
        english_name: "Polish",
        name: "Polski"
    },
    {
        iso_639_1: "pt",
        english_name: "Portuguese",
        name: "Português"
    },
    {
        iso_639_1: "qu",
        english_name: "Quechua",
        name: ""
    },
    {
        iso_639_1: "rm",
        english_name: "Raeto-Romance",
        name: ""
    },
    {
        iso_639_1: "ro",
        english_name: "Romanian",
        name: "Română"
    },
    {
        iso_639_1: "rn",
        english_name: "Rundi",
        name: "Kirundi"
    },
    {
        iso_639_1: "ru",
        english_name: "Russian",
        name: "Pусский"
    },
    {
        iso_639_1: "sg",
        english_name: "Sango",
        name: ""
    },
    {
        iso_639_1: "sa",
        english_name: "Sanskrit",
        name: ""
    },
    {
        iso_639_1: "si",
        english_name: "Sinhalese",
        name: "සිංහල"
    },
    {
        iso_639_1: "sk",
        english_name: "Slovak",
        name: "Slovenčina"
    },
    {
        iso_639_1: "sl",
        english_name: "Slovenian",
        name: "Slovenščina"
    },
    {
        iso_639_1: "se",
        english_name: "Northern Sami",
        name: ""
    },
    {
        iso_639_1: "sm",
        english_name: "Samoan",
        name: ""
    },
    {
        iso_639_1: "sn",
        english_name: "Shona",
        name: ""
    },
    {
        iso_639_1: "sd",
        english_name: "Sindhi",
        name: ""
    },
    {
        iso_639_1: "so",
        english_name: "Somali",
        name: "Somali"
    },
    {
        iso_639_1: "st",
        english_name: "Sotho",
        name: ""
    },
    {
        iso_639_1: "es",
        english_name: "Spanish",
        name: "Español"
    },
    {
        iso_639_1: "sq",
        english_name: "Albanian",
        name: "shqip"
    },
    {
        iso_639_1: "sc",
        english_name: "Sardinian",
        name: ""
    },
    {
        iso_639_1: "sr",
        english_name: "Serbian",
        name: "Srpski"
    },
    {
        iso_639_1: "ss",
        english_name: "Swati",
        name: ""
    },
    {
        iso_639_1: "su",
        english_name: "Sundanese",
        name: ""
    },
    {
        iso_639_1: "sw",
        english_name: "Swahili",
        name: "Kiswahili"
    },
    {
        iso_639_1: "sv",
        english_name: "Swedish",
        name: "svenska"
    },
    {
        iso_639_1: "ty",
        english_name: "Tahitian",
        name: ""
    },
    {
        iso_639_1: "ta",
        english_name: "Tamil",
        name: "தமிழ்"
    },
    {
        iso_639_1: "tt",
        english_name: "Tatar",
        name: ""
    },
    {
        iso_639_1: "te",
        english_name: "Telugu",
        name: "తెలుగు"
    },
    {
        iso_639_1: "tg",
        english_name: "Tajik",
        name: ""
    },
    {
        iso_639_1: "tl",
        english_name: "Tagalog",
        name: ""
    },
    {
        iso_639_1: "th",
        english_name: "Thai",
        name: "ภาษาไทย"
    },
    {
        iso_639_1: "ti",
        english_name: "Tigrinya",
        name: ""
    },
    {
        iso_639_1: "to",
        english_name: "Tonga",
        name: ""
    },
    {
        iso_639_1: "tn",
        english_name: "Tswana",
        name: ""
    },
    {
        iso_639_1: "ts",
        english_name: "Tsonga",
        name: ""
    },
    {
        iso_639_1: "tk",
        english_name: "Turkmen",
        name: ""
    },
    {
        iso_639_1: "tr",
        english_name: "Turkish",
        name: "Türkçe"
    },
    {
        iso_639_1: "tw",
        english_name: "Twi",
        name: ""
    },
    {
        iso_639_1: "ug",
        english_name: "Uighur",
        name: ""
    },
    {
        iso_639_1: "uk",
        english_name: "Ukrainian",
        name: "Український"
    },
    {
        iso_639_1: "ur",
        english_name: "Urdu",
        name: "اردو"
    },
    {
        iso_639_1: "uz",
        english_name: "Uzbek",
        name: "ozbek"
    },
    {
        iso_639_1: "ve",
        english_name: "Venda",
        name: ""
    },
    {
        iso_639_1: "vi",
        english_name: "Vietnamese",
        name: "Tiếng Việt"
    },
    {
        iso_639_1: "vo",
        english_name: "Volapük",
        name: ""
    },
    {
        iso_639_1: "wa",
        english_name: "Walloon",
        name: ""
    },
    {
        iso_639_1: "wo",
        english_name: "Wolof",
        name: "Wolof"
    },
    {
        iso_639_1: "xh",
        english_name: "Xhosa",
        name: ""
    },
    {
        iso_639_1: "yi",
        english_name: "Yiddish",
        name: ""
    },
    {
        iso_639_1: "za",
        english_name: "Zhuang",
        name: ""
    },
    {
        iso_639_1: "zu",
        english_name: "Zulu",
        name: "isiZulu"
    },
    {
        iso_639_1: "ab",
        english_name: "Abkhazian",
        name: ""
    },
    {
        iso_639_1: "zh",
        english_name: "Mandarin",
        name: "普通话"
    },
    {
        iso_639_1: "ps",
        english_name: "Pushto",
        name: "پښتو"
    },
    {
        iso_639_1: "am",
        english_name: "Amharic",
        name: ""
    },
    {
        iso_639_1: "ar",
        english_name: "Arabic",
        name: "العربية"
    },
    {
        iso_639_1: "be",
        english_name: "Belarusian",
        name: "беларуская мова"
    },
    {
        iso_639_1: "bg",
        english_name: "Bulgarian",
        name: "български език"
    },
    {
        iso_639_1: "cn",
        english_name: "Cantonese",
        name: "广州话 / 廣州話"
    },
    {
        iso_639_1: "mk",
        english_name: "Macedonian",
        name: ""
    },
    {
        iso_639_1: "ee",
        english_name: "Ewe",
        name: "Èʋegbe"
    },
    {
        iso_639_1: "el",
        english_name: "Greek",
        name: "ελληνικά"
    },
    {
        iso_639_1: "fa",
        english_name: "Persian",
        name: "فارسی"
    },
    {
        iso_639_1: "he",
        english_name: "Hebrew",
        name: "עִבְרִית"
    },
    {
        iso_639_1: "hi",
        english_name: "Hindi",
        name: "हिन्दी"
    },
    {
        iso_639_1: "hy",
        english_name: "Armenian",
        name: ""
    },
    {
        iso_639_1: "yo",
        english_name: "Yoruba",
        name: "Èdè Yorùbá"
    }
];

export default {
    tvdb: tvdbClient,
    tmdb: tmdbClient,
    parser: {
        parseTMDBMovieDetails
    }
};

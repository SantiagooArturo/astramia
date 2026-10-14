import app from "@/server/router";

// Covers a reading written in the background (after()) on the fallback model.
export const maxDuration = 120;

export const GET = app.fetch;
export const POST = app.fetch;
export const PUT = app.fetch;
export const PATCH = app.fetch;
export const DELETE = app.fetch;
export const OPTIONS = app.fetch;

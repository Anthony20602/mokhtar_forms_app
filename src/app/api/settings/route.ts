import { route } from "@/backend/api/http";
import { getSettings, saveSettings } from "@/backend/services/settings";
import { settingsSchema } from "@/backend/api/validation";

export const GET = route(async () => getSettings());

export const PUT = route(async (req) => saveSettings(settingsSchema.parse(await req.json())));

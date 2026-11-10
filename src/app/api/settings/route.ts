import { route } from "@/lib/http";
import { getSettings, saveSettings } from "@/lib/settings";
import { settingsSchema } from "@/lib/validation";

export const GET = route(async () => getSettings());

export const PUT = route(async (req) => saveSettings(settingsSchema.parse(await req.json())));

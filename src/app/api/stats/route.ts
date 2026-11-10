import { route } from "@/backend/api/http";
import { getStats } from "@/backend/services/persons";

export const GET = route(async () => getStats());

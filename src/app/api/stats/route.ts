import { route } from "@/lib/http";
import { getStats } from "@/lib/persons";

export const GET = route(async () => getStats());

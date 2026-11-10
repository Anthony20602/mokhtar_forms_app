import { route } from "@/backend/api/http";
import { listPrinters } from "@/backend/services/printing";

export const GET = route(async () => ({ printers: await listPrinters() }));

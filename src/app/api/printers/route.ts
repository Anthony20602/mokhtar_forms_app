import { route } from "@/lib/http";
import { listPrinters } from "@/lib/printing";

export const GET = route(async () => ({ printers: await listPrinters() }));

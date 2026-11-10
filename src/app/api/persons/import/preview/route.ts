import { AppError, route } from "@/backend/api/http";
import { MAX_IMPORT_FILE_BYTES, previewImport } from "@/backend/services/personImport";

// POST multipart/form-data with a "file" field (.xlsx). Checks the file and returns the
// rows with their status; nothing is saved.
export const POST = route(async (req) => {
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) throw new AppError(400, "لم يتم إرفاق ملف.");
  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    throw new AppError(400, "الصيغة المقبولة هي Excel الحديث (.xlsx) فقط.");
  }
  if (file.size === 0) throw new AppError(400, "الملف فارغ.");
  if (file.size > MAX_IMPORT_FILE_BYTES) throw new AppError(413, "حجم الملف أكبر من 5 ميغابايت.");
  return previewImport(Buffer.from(await file.arrayBuffer()), file.name);
});

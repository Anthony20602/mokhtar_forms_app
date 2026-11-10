import { route } from "@/backend/api/http";
import { personImportCommitSchema } from "@/backend/api/validation";
import { commitImport } from "@/backend/services/personImport";

// POST { rows: [{ rowNumber, values }] } adds the valid, non-duplicate people and returns
// a summary (imported / skipped / failed). Rows are checked again on the server.
export const POST = route(async (req) => {
  const { rows } = personImportCommitSchema.parse(await req.json());
  return commitImport(rows);
});

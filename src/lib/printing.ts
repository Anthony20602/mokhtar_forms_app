import "server-only";
import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { createPrintToken } from "./auth";
import { AppError } from "./http";
import type { PrinterInfo } from "./types";

const execFileAsync = promisify(execFile);

// PDFs are produced by the Chromium browser that is already on the PC (Edge ships
// with Windows), run headless against this app's own print page. That gives the
// exact same Arabic rendering as the on-screen preview, with nothing extra to install.

function findBrowser(): string {
  const candidates: string[] = [];
  if (process.env.BROWSER_PATH) candidates.push(process.env.BROWSER_PATH);
  if (process.platform === "win32") {
    const roots = [
      process.env["ProgramFiles(x86)"],
      process.env.ProgramFiles,
      process.env.LOCALAPPDATA,
    ].filter((r): r is string => Boolean(r));
    for (const root of roots) {
      candidates.push(path.join(root, "Microsoft", "Edge", "Application", "msedge.exe"));
      candidates.push(path.join(root, "Google", "Chrome", "Application", "chrome.exe"));
    }
  } else if (process.platform === "darwin") {
    candidates.push(
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    );
  } else {
    candidates.push(
      "/usr/bin/google-chrome",
      "/usr/bin/chromium",
      "/usr/bin/chromium-browser",
      "/usr/bin/microsoft-edge",
    );
  }
  const found = candidates.find((c) => existsSync(c));
  if (!found) {
    throw new AppError(
      500,
      "لم يتم العثور على متصفح Edge أو Chrome على هذا الحاسوب لإنشاء ملف PDF. يمكن تحديد مساره في BROWSER_PATH.",
    );
  }
  return found;
}

/** Renders the print page of a document to PDF bytes. `port` is the port this server listens on. */
export async function renderDocumentPdf(documentId: number, port: string): Promise<Buffer> {
  const browser = findBrowser();
  const workDir = await mkdtemp(path.join(os.tmpdir(), "mokhtar-pdf-"));
  const pdfPath = path.join(workDir, "document.pdf");
  const url = `http://127.0.0.1:${port}/documents/${documentId}/print?pt=${createPrintToken(documentId)}`;
  try {
    await execFileAsync(
      browser,
      [
        "--headless=new",
        "--disable-gpu",
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-extensions",
        "--hide-scrollbars",
        "--no-pdf-header-footer",
        // Give fonts and the template image time to load before the page is captured.
        "--virtual-time-budget=6000",
        `--user-data-dir=${path.join(workDir, "profile")}`,
        `--print-to-pdf=${pdfPath}`,
        url,
      ],
      { timeout: 60_000, windowsHide: true },
    );
    if (!existsSync(pdfPath)) throw new Error("the browser did not write a PDF");
    return await readFile(pdfPath);
  } catch (err) {
    if (err instanceof AppError) throw err;
    console.error("[print] PDF rendering failed:", err);
    throw new AppError(500, "تعذّر إنشاء ملف PDF للمستند.");
  } finally {
    // The browser can hold its profile folder for a moment after exiting.
    rm(workDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 400 }).catch(() => {});
  }
}

// ── Printers attached to this PC (Windows) ────────────────────────────────────

async function loadPrinterLib() {
  if (process.platform !== "win32") {
    throw new AppError(501, "الطباعة المباشرة من الخادم متاحة على ويندوز فقط. استخدم طباعة المتصفح.");
  }
  return import("pdf-to-printer");
}

export async function listPrinters(): Promise<PrinterInfo[]> {
  if (process.platform !== "win32") return [];
  const lib = await loadPrinterLib();
  const [printers, def] = await Promise.all([
    lib.getPrinters(),
    lib.getDefaultPrinter().catch(() => null),
  ]);
  return printers.map((p) => ({ name: p.name, isDefault: p.name === def?.name }));
}

export async function printPdf(
  pdf: Buffer,
  opts: { printer?: string; copies?: number },
): Promise<void> {
  const lib = await loadPrinterLib();
  if (opts.printer) {
    const known = await lib.getPrinters();
    if (!known.some((p) => p.name === opts.printer)) {
      throw new AppError(400, `الطابعة "${opts.printer}" غير موجودة على هذا الحاسوب.`);
    }
  }
  const workDir = await mkdtemp(path.join(os.tmpdir(), "mokhtar-print-"));
  const file = path.join(workDir, "document.pdf");
  try {
    await writeFile(file, pdf);
    await lib.print(file, {
      printer: opts.printer || undefined,
      copies: opts.copies ?? 1,
      paperSize: "A4",
      // Never let the driver shrink the page: the values must land on the form's boxes.
      scale: "noscale",
      silent: true,
    });
  } catch (err) {
    if (err instanceof AppError) throw err;
    console.error("[print] sending to printer failed:", err);
    throw new AppError(500, "تعذّر إرسال المستند إلى الطابعة. تأكّد أنها موصولة وتعمل.");
  } finally {
    rm(workDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 400 }).catch(() => {});
  }
}

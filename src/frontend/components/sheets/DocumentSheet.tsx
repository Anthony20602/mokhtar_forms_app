"use client";

import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { formatIsoDate } from "@/shared/arabic";
import { getTemplate } from "@/shared/forms";
import { LETTER_DETAIL_ROWS } from "@/shared/forms/letter";
import type { FormDef, MarkDef } from "@/shared/forms/types";
import type { DocData, ExtraText, Offset, Settings } from "@/shared/types";

const PX_PER_MM = 96 / 25.4;
const round = (n: number) => Math.round(n * 10) / 10;

/** Present only in the editor: lets values be dragged to a better spot. */
export interface SheetInteraction {
  moveMode: boolean;
  /** Current on-screen scale of the sheet, to convert pointer pixels to millimetres. */
  zoom: number;
  onMoveMark: (key: string, offset: Offset) => void;
  onMoveExtra: (id: string, x: number, y: number) => void;
}

interface SheetProps {
  form: FormDef;
  data: DocData;
  settings: Settings;
  interaction?: SheetInteraction;
}

/** The A4 page of a document, exactly as it prints. */
export function DocumentSheet(props: SheetProps) {
  return props.form.kind === "template" ? <TemplateSheet {...props} /> : <LetterSheet {...props} />;
}

/** Starts a drag; `apply` receives the new position in millimetres. */
function startDrag(
  e: ReactPointerEvent<HTMLElement>,
  zoom: number,
  origin: { x: number; y: number },
  apply: (x: number, y: number) => void,
) {
  e.preventDefault();
  const el = e.currentTarget;
  const startX = e.clientX;
  const startY = e.clientY;
  el.setPointerCapture(e.pointerId);
  const move = (ev: PointerEvent) => {
    const scale = PX_PER_MM * zoom;
    apply(round(origin.x + (ev.clientX - startX) / scale), round(origin.y + (ev.clientY - startY) / scale));
  };
  const stop = () => {
    el.removeEventListener("pointermove", move);
    el.removeEventListener("pointerup", stop);
    el.removeEventListener("pointercancel", stop);
  };
  el.addEventListener("pointermove", move);
  el.addEventListener("pointerup", stop);
  el.addEventListener("pointercancel", stop);
}

/**
 * Largest font size (pt) at which `text` still fits on one line of `widthMm`.
 * An estimate from average glyph widths; long names shrink instead of spilling
 * over the neighbouring printed label.
 */
function fitFontSize(text: string, widthMm: number, base: number, ltr: boolean): number {
  const length = Array.from(text).length;
  if (length === 0) return base;
  const mmPerCharPerPt = ltr ? 0.2 : 0.165;
  return Math.max(5.5, Math.min(base, widthMm / (length * mmPerCharPerPt)));
}

function Extras({ extras, interaction }: { extras: ExtraText[]; interaction?: SheetInteraction }) {
  const movable = Boolean(interaction?.moveMode);
  return (
    <>
      {extras.map((extra) => (
        <div
          key={extra.id}
          className={`extra-text ${movable ? "movable" : ""}`}
          // Anchored by its right edge, the natural start of Arabic text.
          style={{ right: `${210 - extra.x}mm`, top: `${extra.y}mm`, fontSize: `${extra.size}pt` }}
          onPointerDown={
            movable
              ? (e) =>
                  startDrag(e, interaction!.zoom, { x: extra.x, y: extra.y }, (x, y) =>
                    interaction!.onMoveExtra(extra.id, x, y),
                  )
              : undefined
          }
        >
          {extra.text || (movable ? "نص" : "")}
        </div>
      ))}
    </>
  );
}

// ── Official template: values written at measured positions over the scan ─────

function TemplateSheet({ form, data, settings, interaction }: SheetProps) {
  const template = getTemplate(form);
  if (!template) return <div className="sheet" />;

  const display = template.display(data.values);
  const offsets = data.offsets ?? {};
  const showBackground = data.showBackground !== false;
  const movable = Boolean(interaction?.moveMode);
  // The calibration shift is for paper that already carries the printed form.
  const shift: CSSProperties | undefined =
    !showBackground && (settings.printOffsetX || settings.printOffsetY)
      ? { transform: `translate(${settings.printOffsetX}mm, ${settings.printOffsetY}mm)` }
      : undefined;

  return (
    <div className="sheet">
      {showBackground && form.background ? (
        // eslint-disable-next-line @next/next/no-img-element -- must print at exact physical size
        <img className="sheet-bg" src={form.background} alt="" draggable={false} />
      ) : null}
      <div className="sheet-layer" style={shift}>
        {template.marks.map((mark) => (
          <Mark
            key={mark.key}
            mark={mark}
            text={display[mark.key] ?? ""}
            offset={offsets[mark.key]}
            baseSize={settings.valueFontSize}
            interaction={interaction}
            movable={movable}
          />
        ))}
        <Extras extras={data.extras ?? []} interaction={interaction} />
      </div>
    </div>
  );
}

function Mark({
  mark,
  text,
  offset,
  baseSize,
  interaction,
  movable,
}: {
  mark: MarkDef;
  text: string;
  offset?: Offset;
  baseSize: number;
  interaction?: SheetInteraction;
  movable: boolean;
}) {
  if (!text && !movable) return null;
  const dx = offset?.dx ?? 0;
  const dy = offset?.dy ?? 0;
  const base = mark.size ?? baseSize;
  const size = mark.wrap ? base : fitFontSize(text, mark.w - 1, base, Boolean(mark.ltr));
  const align = mark.align ?? "center";
  const valign = mark.valign ?? "middle";
  const classes = [
    "mark",
    mark.wrap ? "wrap" : "",
    movable ? "movable" : "",
    movable && (dx || dy) ? "moved" : "",
    interaction && !movable && text ? "filled-hint" : "",
  ];
  return (
    <div
      className={classes.filter(Boolean).join(" ")}
      title={interaction ? mark.label : undefined}
      style={{
        left: `${mark.x + dx}mm`,
        top: `${mark.y + dy}mm`,
        width: `${mark.w}mm`,
        height: `${mark.h}mm`,
        fontSize: `${size}pt`,
        alignItems: valign === "middle" ? "center" : valign === "bottom" ? "flex-end" : "flex-start",
      }}
      onPointerDown={
        movable
          ? (e) =>
              startDrag(e, interaction!.zoom, { x: dx, y: dy }, (x, y) =>
                interaction!.onMoveMark(mark.key, { dx: x, dy: y }),
              )
          : undefined
      }
    >
      <span dir={mark.ltr ? "ltr" : "rtl"} style={{ textAlign: align }}>
        {text}
      </span>
    </div>
  );
}

// ── Letter: a complete certificate laid out by the app ───────────────────────

function LetterSheet({ data, settings, interaction }: SheetProps) {
  const v = data.values;
  const rows = LETTER_DETAIL_ROWS.filter((row) => (v[row.key] ?? "").trim() !== "");
  const mukhtarLine = [
    settings.mukhtarName ? `أنا الموقع أدناه ${settings.mukhtarName}،` : "أنا الموقع أدناه،",
    `مختار بلدة ${settings.town || "................"}`,
    settings.qadaa ? `- قضاء ${settings.qadaa}،` : "،",
    "أفيد بما يلي:",
  ].join(" ");

  return (
    <div className="sheet">
      <div className="absolute inset-0 flex flex-col px-[20mm] pb-[18mm] pt-[16mm] text-[13pt] leading-[1.9]">
        <header className="flex items-start justify-between">
          <div className="font-bold leading-[1.7]">
            <p className="text-[15pt]">الجمهورية اللبنانية</p>
            <p>وزارة الداخلية والبلديات</p>
            {settings.muhafaza ? <p className="font-semibold">محافظة {settings.muhafaza}</p> : null}
            {settings.qadaa ? <p className="font-semibold">قضاء {settings.qadaa}</p> : null}
            <p className="font-semibold">مختار بلدة {settings.town}</p>
          </div>
          <div className="text-[12pt] leading-[1.9]">
            <p>
              الرقم: <span className="inline-block min-w-[22mm] border-b border-black text-center font-semibold" dir="ltr">{v.serial}</span>
            </p>
            <p>
              التاريخ: <span className="inline-block min-w-[22mm] border-b border-black text-center font-semibold" dir="ltr">{formatIsoDate(v.date ?? "")}</span>
            </p>
          </div>
        </header>

        <h1 className="mb-[7mm] mt-[9mm] text-center text-[20pt] font-bold underline underline-offset-[2.5mm]">
          {v.title}
        </h1>

        <p>{mukhtarLine}</p>

        {rows.length ? (
          <table className="my-[4mm] w-full border-collapse text-[12.5pt] leading-[1.6]">
            <tbody>
              {rows.map((row) => (
                <tr key={row.key}>
                  <th className="w-[45mm] border border-black bg-neutral-100 px-[3mm] py-[1.4mm] text-start font-bold">
                    {row.label}
                  </th>
                  <td className="border border-black px-[3mm] py-[1.4mm] font-semibold">{v[row.key]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}

        <p className="whitespace-pre-wrap text-justify">{v.body}</p>

        {(v.purpose ?? "").trim() ? (
          <p className="mt-[3mm]">
            أعطيت هذه الإفادة بناءً على طلب صاحب العلاقة لأجل: <span className="font-bold">{v.purpose}</span>
          </p>
        ) : (
          <p className="mt-[3mm]">أعطيت هذه الإفادة بناءً على طلب صاحب العلاقة.</p>
        )}

        <footer className="mt-auto flex items-start justify-between pt-[8mm] text-center">
          <div className="w-[60mm]">
            <p className="font-bold">توقيع صاحب العلاقة</p>
            <div className="mt-[22mm] border-t border-dotted border-black" />
          </div>
          <div className="w-[70mm]">
            <p className="font-bold">المختار</p>
            {settings.mukhtarName ? <p className="font-semibold">{settings.mukhtarName}</p> : null}
            <div className="mt-[18mm] border-t border-dotted border-black" />
            <p className="text-[10.5pt]">الختم والتوقيع</p>
          </div>
        </footer>
      </div>
      <div className="sheet-layer pointer-events-none [&>*]:pointer-events-auto">
        <Extras extras={data.extras ?? []} interaction={interaction} />
      </div>
    </div>
  );
}

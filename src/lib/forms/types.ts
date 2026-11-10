export type InputType = "text" | "date" | "tel" | "email" | "number" | "textarea" | "select";

/** One editable box in the form editor. */
export interface InputDef {
  key: string;
  label: string;
  group: string;
  type?: InputType;
  /** Fixed choices for "select"; suggestions (still free text) for the other types. */
  options?: string[];
  /** Takes the full row of the editor grid instead of half. */
  wide?: boolean;
  /** Latin text / numbers typed left-to-right (phones, e-mail). */
  ltr?: boolean;
  rows?: number;
  hint?: string;
}

/** Where a value is written on an official template. All numbers are millimetres. */
export interface MarkDef {
  /** Key into the display values (an input key, or a derived key such as "dateDay"). */
  key: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  align?: "center" | "right" | "left";
  valign?: "middle" | "bottom" | "top";
  /** Font size in pt; defaults to the size chosen in Settings. */
  size?: number;
  ltr?: boolean;
  /** Wrap long text inside the box instead of shrinking it onto one line. */
  wrap?: boolean;
}

export interface FormDef {
  type: string;
  title: string;
  /** "template": values written onto a scan of the official form. "letter": free-standing certificate. */
  kind: "template" | "letter";
  icon: string;
  /** Background image under /public for template forms. */
  background?: string;
  /** Default statement for letter forms. {town} and {mukhtar} are filled in from Settings. */
  body?: string;
}

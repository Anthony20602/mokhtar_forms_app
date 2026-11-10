import { LETTER_GROUPS, LETTER_INPUTS } from "./letter";
import { RESIDENCE_GROUPS, RESIDENCE_INPUTS, RESIDENCE_MARKS, residenceDisplay } from "./residence";
import type { FormDef, InputDef, MarkDef } from "./types";

export * from "./registry";
export type * from "./types";

interface TemplateSpec {
  inputs: InputDef[];
  groups: readonly string[];
  marks: MarkDef[];
  display: (values: Record<string, string>) => Record<string, string>;
}

// To support another official form: scan it into public/templates, describe its
// inputs and mark positions like residence.ts does, and register it here.
const TEMPLATES: Record<string, TemplateSpec> = {
  residence: {
    inputs: RESIDENCE_INPUTS,
    groups: RESIDENCE_GROUPS,
    marks: RESIDENCE_MARKS,
    display: residenceDisplay,
  },
};

export function getTemplate(form: FormDef): TemplateSpec | null {
  return form.kind === "template" ? (TEMPLATES[form.type] ?? null) : null;
}

export function getInputs(form: FormDef): { inputs: InputDef[]; groups: readonly string[] } {
  const template = getTemplate(form);
  return template
    ? { inputs: template.inputs, groups: template.groups }
    : { inputs: LETTER_INPUTS, groups: LETTER_GROUPS };
}

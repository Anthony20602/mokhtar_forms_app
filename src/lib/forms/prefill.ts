import { fullName, todayIso } from "../arabic";
import type { DocData, Person, Settings } from "../types";
import type { FormDef } from "./types";

// Things that belong to one issuance and must never be copied from an older document.
const PER_DOCUMENT_KEYS = ["serial", "date", "purpose", "notes", "title", "body"];

/**
 * Starting values for a new document: office settings + the person's registry
 * data, topped up with what was typed the last time this person got the same form
 * (address, phones, marital status ...), so it is only typed once.
 */
export function buildInitialData(
  form: FormDef,
  person: Person | null,
  settings: Settings,
  previous: DocData | null,
): DocData {
  const remembered: Record<string, string> = {};
  for (const [key, value] of Object.entries(previous?.values ?? {})) {
    if (!PER_DOCUMENT_KEYS.includes(key) && value) remembered[key] = value;
  }

  const registryPlace = [settings.town, person?.recordNo].filter(Boolean).join(" ");
  let values: Record<string, string>;

  if (form.kind === "template") {
    values = {
      ...remembered,
      serial: "",
      date: todayIso(),
      muhafaza: settings.muhafaza,
      qadaa: settings.qadaa,
      town: settings.town,
      resMuhafaza: remembered.resMuhafaza ?? settings.muhafaza,
      resQadaa: remembered.resQadaa ?? settings.qadaa,
      city: remembered.city ?? settings.town,
      purpose: "",
      notes: "",
    };
    if (person) {
      Object.assign(values, {
        firstName: person.firstName,
        lastName: person.familyName,
        fatherName: person.fatherName,
        motherName: person.motherName,
        birthDate: person.birthDate,
        gender: person.gender,
        registryPlace: remembered.registryPlace ?? registryPlace,
        registryQadaa: remembered.registryQadaa ?? settings.qadaa,
        registryMuhafaza: remembered.registryMuhafaza ?? settings.muhafaza,
      });
    }
  } else {
    values = {
      ...remembered,
      title: form.title,
      serial: "",
      date: todayIso(),
      body: (form.body ?? "")
        .replaceAll("{town}", settings.town)
        .replaceAll("{mukhtar}", settings.mukhtarName),
      purpose: "",
    };
    if (person) {
      Object.assign(values, {
        fullName: fullName(person),
        fatherName: person.fatherName,
        motherName: person.motherName,
        birthDate: person.birthDate,
        gender: person.gender,
        recordNo: person.recordNo,
        registryPlace: remembered.registryPlace ?? settings.town,
      });
    }
  }

  return {
    values,
    offsets: {},
    extras: [],
    showBackground: previous?.showBackground ?? true,
  };
}

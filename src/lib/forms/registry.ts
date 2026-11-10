import type { FormDef } from "./types";

// The fifteen forms the mokhtar's office issues (same list as the original app).
// Only "إفادة سكن" has an official template scan; the others are produced as a
// certificate letter whose statement can be edited before printing.
export const FORMS: FormDef[] = [
  {
    type: "residence",
    title: "إفادة سكن",
    kind: "template",
    icon: "home",
    background: "/templates/residence.jpg",
  },
  {
    type: "id",
    title: "إفادة تعريف - لزوم بطاقة هوية",
    kind: "letter",
    icon: "badge",
    body: "أفيد بأن صاحب العلاقة المذكور أعلاه معروف لديّ شخصياً، وأن المعلومات الواردة أعلاه صحيحة ومطابقة لقيود سجلات النفوس. أعطيت هذه الإفادة لزوم الاستحصال على بطاقة هوية.",
  },
  {
    type: "name",
    title: "إفادة تعريف اسم",
    kind: "letter",
    icon: "id",
    body: "أفيد بأن اسم صاحب العلاقة المذكور أعلاه صحيح ومطابق لقيود سجلات النفوس في بلدة {town}.",
  },
  {
    type: "inheritance",
    title: "إفادة حصر إرث",
    kind: "letter",
    icon: "landmark",
    body: "أفيد بأن المرحوم المذكور أعلاه قد توفي، وأن إرثه الشرعي ينحصر بالورثة التالية أسماؤهم دون سواهم:\n١- \n٢- \n٣- ",
  },
  {
    type: "provider",
    title: "إفادة معيل",
    kind: "letter",
    icon: "users",
    body: "أفيد بأن صاحب العلاقة المذكور أعلاه هو المعيل الوحيد لعائلته، وليس للعائلة أي معيل سواه.",
  },
  {
    type: "clearance",
    title: "براءة ذمة",
    kind: "letter",
    icon: "check",
    body: "أفيد بأن صاحب العلاقة المذكور أعلاه بريء الذمة تجاه مختارية بلدة {town}، ولا يترتب عليه أي التزامات مالية لديها.",
  },
  {
    type: "marital_status",
    title: "تصريح عن الوضع العائلي",
    kind: "letter",
    icon: "heart",
    body: "أفيد بأن الوضع العائلي لصاحب العلاقة المذكور أعلاه هو كما ورد أعلاه، وذلك بحسب قيود سجلات النفوس وما هو معروف لديّ.",
  },
  {
    type: "residence_declaration",
    title: "تعهد سكن",
    kind: "letter",
    icon: "building",
    body: "أتعهد أنا الموقع أدناه صاحب العلاقة المذكور أعلاه بأنني أقيم فعلياً في بلدة {town}، وأتحمل كامل المسؤولية عن صحة هذا التصريح.",
  },
  {
    type: "criminal_record",
    title: "تفويض للحصول على بيان السجل العدلي",
    kind: "letter",
    icon: "scale",
    body: "أفوّض أنا صاحب العلاقة المذكور أعلاه السيد ................................ بالاستحصال على بيان السجل العدلي العائد لي من المراجع المختصة.",
  },
  {
    type: "good_conduct",
    title: "شهادة حسن سلوك",
    kind: "letter",
    icon: "thumbs",
    body: "أشهد بأن صاحب العلاقة المذكور أعلاه حسن السيرة والسلوك، ولم يُعرف عنه ما يخلّ بالشرف أو الأخلاق العامة.",
  },
  {
    type: "civil_status",
    title: "طلب بيان قيد أو وثيقة من دائرة النفوس",
    kind: "letter",
    icon: "file",
    body: "أطلب من دائرة النفوس المختصة تزويدي ببيان قيد ................ عائد لصاحب العلاقة المذكور أعلاه.",
  },
  {
    type: "lost_id_receipt",
    title: "طلب استلام بطاقة الهوية بسبب فقدان الإيصال",
    kind: "letter",
    icon: "card",
    body: "أفيد بأن صاحب العلاقة المذكور أعلاه قد فقد إيصال طلب بطاقة الهوية العائدة له، وهو يطلب استلام بطاقته بموجب هذه الإفادة.",
  },
  {
    type: "re_registration_divorced",
    title: "طلب إعادة قيد مطلقة",
    kind: "letter",
    icon: "refresh",
    body: "أطلب إعادة قيد صاحبة العلاقة المذكورة أعلاه على خانة والدها بعد أن تم طلاقها، وذلك وفقاً للأصول.",
  },
  {
    type: "citizenship_marriage",
    title: "طلب اكتساب الجنسية اللبنانية بمفعول الزواج",
    kind: "letter",
    icon: "gavel",
    body: "أطلب أنا صاحبة العلاقة المذكورة أعلاه اكتساب الجنسية اللبنانية بمفعول زواجي من السيد ................................ اللبناني الجنسية.",
  },
  {
    type: "to_whom_it_may_concern",
    title: "لمن يهمه الأمر",
    kind: "letter",
    icon: "mail",
    body: "أفيد بأن المعلومات الواردة أعلاه صحيحة ومطابقة لقيود سجلات النفوس.",
  },
];

export function getForm(type: string | undefined | null): FormDef | undefined {
  return FORMS.find((f) => f.type === type);
}

export function formTitle(type: string): string {
  return getForm(type)?.title ?? type;
}

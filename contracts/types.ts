export * from "./errors";

/* ─────────────── أنواع الدعاوى والأضابير (الرموز القانونية) ─────────────── */

export const CASE_TYPES = [
  { code: "ب", label: "بداءة" },
  { code: "ج", label: "جنح" },
  { code: "ح", label: "تحقيق" },
  { code: "أ", label: "أحوال شخصية" },
  { code: "ش", label: "شرعية" },
] as const;

export const EXEC_TYPES = [
  { code: "ت", label: "تنفيذ أصلي" },
  { code: "خ", label: "تنفيذ خارجي" },
] as const;

export const EXEC_SUBTYPES = ["أصلي", "خارجي", "إنابة", "فرعية"] as const;

/** تنسيق الرقم القانوني الرسمي: YYYY/T/NNNNN */
export function formatFileNumber(
  year: number,
  type: string,
  seq: number,
): string {
  return `${year}/${type}/${String(seq).padStart(5, "0")}`;
}

export const LAWSUIT_STATUSES = [
  "منظورة",
  "محجوزة للحكم",
  "محكومة",
  "مؤجلة",
  "مغلقة",
] as const;

export const EXECUTION_STATUSES = [
  "قيد التنفيذ",
  "معلقة",
  "منجزة",
  "مغلقة",
] as const;

export const SESSION_STATUSES = ["قادمة", "انعقدت", "مؤجلة"] as const;

export const TASK_STATUSES = ["قيد الانتظار", "قيد التنفيذ", "منجزة"] as const;
export const TASK_PRIORITIES = ["عالية", "متوسطة", "منخفضة"] as const;
export const TASK_TYPES = [
  "مراجعة محكمة",
  "مراجعة مديرية تنفيذ",
  "حضور جلسة",
  "إعداد لائحة",
  "تبليغ",
  "متابعة تسديد",
  "عامة",
] as const;

export const PAYMENT_KINDS = [
  { code: "wasil", label: "واصل (قبل الدعوى)" },
  { code: "maslam", label: "مستلم (من التنفيذ)" },
] as const;

export const DEBT_SOURCES = ["فاتورة", "سند", "أخرى"] as const;

/* ─────────────────────── المستخدمون والصلاحيات ─────────────────────────── */

export const ROLES = [
  { code: "admin", label: "مدير النظام" },
  { code: "manager", label: "مدير مكتب" },
  { code: "data_entry", label: "موظف إدخال" },
  { code: "lawyer", label: "محامٍ" },
  { code: "viewer", label: "مشاهدة فقط" },
] as const;

export type RoleCode = (typeof ROLES)[number]["code"];

/** صلاحيات كل دور على مستوى الوحدات والعمليات */
export const ROLE_PERMISSIONS: Record<
  RoleCode,
  { modules: string[] | "all"; canEdit: boolean; canDelete: boolean }
> = {
  admin: { modules: "all", canEdit: true, canDelete: true },
  manager: {
    modules: [
      "dashboard",
      "customers",
      "debtors",
      "lawsuits",
      "executions",
      "lawyers",
      "tasks",
      "sessions",
      "calendar",
      "messages",
      "reports",
      "backup",
      "system",
      "settings",
    ],
    canEdit: true,
    canDelete: true,
  },
  data_entry: {
    modules: [
      "dashboard",
      "customers",
      "debtors",
      "lawsuits",
      "executions",
      "tasks",
      "sessions",
      "calendar",
      "messages",
      "settings",
    ],
    canEdit: true,
    canDelete: false,
  },
  lawyer: {
    modules: ["dashboard", "lawyers", "tasks", "sessions", "calendar", "messages"],
    canEdit: true,
    canDelete: false,
  },
  viewer: {
    modules: [
      "dashboard",
      "customers",
      "debtors",
      "lawsuits",
      "executions",
      "lawyers",
      "tasks",
      "sessions",
      "calendar",
      "messages",
      "reports",
    ],
    canEdit: false,
    canDelete: false,
  },
};

export function roleCanAccess(role: RoleCode, moduleKey: string): boolean {
  const p = ROLE_PERMISSIONS[role];
  if (!p) return false;
  return p.modules === "all" || p.modules.includes(moduleKey);
}

/* ──────────────────────── القوالب القانونية الديناميكية ─────────────────── */
/* المتغيرات: {lawyer} {customer} {fileType} {fileNo} {court} {directorate}
   {lastAction} {lastActionDate} {requiredAction} {date} {location}
   {amount} {installmentsCount} {periods} {dueDate}                          */

export interface MessageTemplate {
  key: string;
  label: string;
  audience: "lawyer" | "customer";
  body: string;
}

export const MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    key: "court_session_notice",
    label: "تبليغ جلسة مرافعة",
    audience: "lawyer",
    body: `الأستاذ {lawyer} المحترم، تحية طيبة وبعد،
نود إحاطتكم علماً بموعد جلسة مرافعة:
اسم الزبون: {customer}
رقم الدعوى: {fileNo}
المحكمة المختصة: {court}
آخر إجراء: {lastAction}
تاريخ آخر إجراء: {lastActionDate}
موعد الجلسة: {date}
مكان المراجعة: المحكمة المختصة
الإجراء المطلوب: {requiredAction}
مع خالص التقدير.`,
  },
  {
    key: "execution_review",
    label: "مراجعة مديرية تنفيذ",
    audience: "lawyer",
    body: `الأستاذ {lawyer} المحترم، تحية طيبة وبعد،
نود إحاطتكم علماً بموعد مراجعة مديرية التنفيذ:
اسم الزبون: {customer}
رقم الإضبارة: {fileNo}
نوع الملف: إضبارة تنفيذية
مديرية التنفيذ: {directorate}
آخر إجراء: {lastAction}
تاريخ آخر إجراء: {lastActionDate}
الموعد: {date}
مكان المراجعة: مديرية التنفيذ ({directorate})
الإجراء المطلوب: {requiredAction}
مع خالص التقدير.`,
  },
  {
    key: "case_assignment",
    label: "تكليف بملف قضائي",
    audience: "lawyer",
    body: `الأستاذ {lawyer} المحترم، تحية طيبة وبعد،
نود تكليفكم بمتابعة الملف التالي:
اسم الزبون: {customer}
نوع الملف: {fileType}
رقم الملف: {fileNo}
آخر إجراء: {lastAction}
تاريخ آخر إجراء: {lastActionDate}
الإجراء المطلوب: {requiredAction}
يرجى التكرم بالمتابعة وإعلامنا بالمستجدات.
مع خالص التقدير.`,
  },
  {
    key: "task_assignment",
    label: "تكليف بإجراء",
    audience: "lawyer",
    body: `الأستاذ {lawyer} المحترم، تحية طيبة وبعد،
نود تكليفكم بالإجراء التالي:
المهمة: {taskTitle}
اسم الزبون: {customer}
رقم الملف: {fileNo}
الإجراء المطلوب: {requiredAction}
تاريخ الاستحقاق: {dueDate}
الأولوية: {priority}
يرجى التكرم بالإنجاز وإعلامنا بالنتيجة.
مع خالص التقدير.`,
  },
  {
    key: "appointment_notice",
    label: "إشعار بموعد",
    audience: "customer",
    body: `السيد/السيدة {customer} المحترم/ة، تحية طيبة وبعد،
نود إحاطتكم علماً بأن لديكم موعد مراجعة بخصوص ملفكم:
رقم الملف: {fileNo}
نوع الملف: {fileType}
آخر إجراء: {lastAction}
تاريخ آخر إجراء: {lastActionDate}
الموعد: {date}
مكان المراجعة: {location}
يرجى التفضل بالحضور في الموعد المحدد.
مع خالص التقدير.`,
  },
  {
    key: "payment_notice",
    label: "إشعار بتسديد",
    audience: "customer",
    body: `السيد/السيدة {customer} المحترم/ة، تحية طيبة وبعد،
نشكر لكم تسديدكم مبلغاً وقدره {amount} دينار عراقي بتاريخ {date}.
{fileNo}
مع خالص التقدير والاحترام.`,
  },
  {
    key: "installment_reminder",
    label: "إشعار بالأقساط المستحقة",
    audience: "customer",
    body: `السيد/السيدة {customer} المحترم/ة، تحية طيبة وبعد،
نود تذكيركم بوجود أقساط مستحقة بذمتكم بإجمالي {amount} دينار عراقي،
وذلك عن {installmentsCount} قسط/أقساط مستحقة حتى تاريخ {date}:
{periods}
يرجى التفضل بمراجعتنا وتسديد المبلغ المستحق.
مع خالص التقدير والاحترام.`,
  },
];

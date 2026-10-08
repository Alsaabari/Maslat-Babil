import {
  mysqlTable,
  serial,
  varchar,
  text,
  bigint,
  date,
  datetime,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/mysql-core";

/* ───────────────────────── المستخدمون والصلاحيات ───────────────────────── */

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 128 }).notNull(),
  displayName: varchar("display_name", { length: 200 }).notNull(),
  // admin | manager | data_entry | lawyer | viewer
  role: varchar("role", { length: 30 }).notNull().default("viewer"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* ───────────────────────────── الجهات المرجعية ──────────────────────────── */

export const courts = mysqlTable("courts", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
});

export const judges = mysqlTable("judges", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  courtId: bigint("court_id", { mode: "number", unsigned: true }),
});

export const executionDirectorates = mysqlTable("execution_directorates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
});

export const lawyers = mysqlTable("lawyers", {
  id: serial("id").primaryKey(),
  fullName: varchar("full_name", { length: 200 }).notNull(),
  phone: varchar("phone", { length: 30 }),
  specialty: varchar("specialty", { length: 200 }),
  notes: text("notes"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* ─────────────────────────────── الزبائن ───────────────────────────────── */

export const customers = mysqlTable(
  "customers",
  {
    id: serial("id").primaryKey(),
    fullName: varchar("full_name", { length: 250 }).notNull(),
    phone1: varchar("phone1", { length: 30 }),
    phone2: varchar("phone2", { length: 30 }),
    nationalId: varchar("national_id", { length: 30 }),
    governorate: varchar("governorate", { length: 100 }),
    district: varchar("district", { length: 150 }), // القضاء/الناحية
    policeStation: varchar("police_station", { length: 150 }),
    employer: varchar("employer", { length: 200 }), // جهة العمل
    jobTitle: varchar("job_title", { length: 150 }), // الوظيفة
    address: text("address"),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  },
  (t) => [index("idx_customers_name").on(t.fullName)],
);

/* ──────────────────────────────── الديون ───────────────────────────────── */

export const debts = mysqlTable(
  "debts",
  {
    id: serial("id").primaryKey(),
    customerId: bigint("customer_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => customers.id),
    principal: bigint("principal", { mode: "number", unsigned: true }).notNull(), // أصل الدين
    source: varchar("source", { length: 50 }).notNull().default("فاتورة"), // فاتورة | سند | أخرى
    reference: varchar("reference", { length: 100 }), // رقم الفاتورة/السند
    issuedAt: date("issued_at", { mode: "date" }),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("idx_debts_customer").on(t.customerId)],
);

/* التسديدات: kind = wasil (الواصل قبل الدعوى) | maslam (المبلغ المستلم من التنفيذ) */
export const payments = mysqlTable(
  "payments",
  {
    id: serial("id").primaryKey(),
    customerId: bigint("customer_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => customers.id),
    debtId: bigint("debt_id", { mode: "number", unsigned: true }).references(
      () => debts.id,
    ),
    executionFileId: bigint("execution_file_id", {
      mode: "number",
      unsigned: true,
    }),
    kind: varchar("kind", { length: 20 }).notNull().default("wasil"),
    amount: bigint("amount", { mode: "number", unsigned: true }).notNull(),
    paidAt: date("paid_at", { mode: "date" }).notNull(),
    method: varchar("method", { length: 100 }), // نقدي | تحويل | عبر التنفيذ...
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("idx_payments_customer").on(t.customerId),
    index("idx_payments_execution").on(t.executionFileId),
  ],
);

/* الأقساط */
export const installments = mysqlTable(
  "installments",
  {
    id: serial("id").primaryKey(),
    customerId: bigint("customer_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => customers.id),
    debtId: bigint("debt_id", { mode: "number", unsigned: true }).references(
      () => debts.id,
    ),
    periodLabel: varchar("period_label", { length: 100 }).notNull(), // قسط كانون الثاني 2026
    amount: bigint("amount", { mode: "number", unsigned: true }).notNull(),
    dueDate: date("due_date", { mode: "date" }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("مستحق"), // مستحق | مسدد | مسدد جزئياً
    paidAt: date("paid_at", { mode: "date" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("idx_installments_customer").on(t.customerId)],
);

/* ─────────────────────────────── الدعاوى ───────────────────────────────── */
/* الرقم القانوني: YYYY/T/NNNNN — يُشتق من caseYear + caseType + caseSeq */

export const lawsuits = mysqlTable(
  "lawsuits",
  {
    id: serial("id").primaryKey(),
    customerId: bigint("customer_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => customers.id),
    debtId: bigint("debt_id", { mode: "number", unsigned: true }).references(
      () => debts.id,
    ),
    lawyerId: bigint("lawyer_id", { mode: "number", unsigned: true }).references(
      () => lawyers.id,
    ),
    courtId: bigint("court_id", { mode: "number", unsigned: true }).references(
      () => courts.id,
    ),
    judgeId: bigint("judge_id", { mode: "number", unsigned: true }).references(
      () => judges.id,
    ),
    caseYear: bigint("case_year", { mode: "number", unsigned: true }).notNull(),
    // ب بداءة | ج جنح | ح تحقيق | أ أحوال شخصية | ش شرعية
    caseType: varchar("case_type", { length: 5 }).notNull(),
    caseSeq: bigint("case_seq", { mode: "number", unsigned: true }).notNull(),
    status: varchar("status", { length: 50 }).notNull().default("منظورة"),
    subject: varchar("subject", { length: 300 }),
    filedAt: date("filed_at", { mode: "date" }),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("idx_lawsuits_customer").on(t.customerId),
    index("idx_lawsuits_lawyer").on(t.lawyerId),
    index("idx_lawsuits_number").on(t.caseYear, t.caseType, t.caseSeq),
  ],
);

/* ────────────────────────── الأضابير التنفيذية ─────────────────────────── */
/* execType: ت أصلي | خ خارجي — subType: أصلي | خارجي | إنابة | فرعية */

export const executionFiles = mysqlTable(
  "execution_files",
  {
    id: serial("id").primaryKey(),
    customerId: bigint("customer_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => customers.id),
    lawsuitId: bigint("lawsuit_id", { mode: "number", unsigned: true }).references(
      () => lawsuits.id,
    ),
    lawyerId: bigint("lawyer_id", { mode: "number", unsigned: true }).references(
      () => lawyers.id,
    ),
    directorateId: bigint("directorate_id", {
      mode: "number",
      unsigned: true,
    }).references(() => executionDirectorates.id),
    externalDirectorateId: bigint("external_directorate_id", {
      mode: "number",
      unsigned: true,
    }).references(() => executionDirectorates.id),
    externalFileNo: varchar("external_file_no", { length: 100 }),
    execYear: bigint("exec_year", { mode: "number", unsigned: true }).notNull(),
    execType: varchar("exec_type", { length: 5 }).notNull(), // ت | خ
    execSeq: bigint("exec_seq", { mode: "number", unsigned: true }).notNull(),
    subType: varchar("sub_type", { length: 20 }).notNull().default("أصلي"),
    amountExecuted: bigint("amount_executed", {
      mode: "number",
      unsigned: true,
    }).notNull(), // المبلغ المنفذ
    status: varchar("status", { length: 50 }).notNull().default("قيد التنفيذ"),
    openedAt: date("opened_at", { mode: "date" }),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("idx_executions_customer").on(t.customerId),
    index("idx_executions_lawyer").on(t.lawyerId),
  ],
);

/* ─────────────────────────────── الإجراءات ─────────────────────────────── */
/* entityType: lawsuit | execution | task */

export const procedures = mysqlTable(
  "procedures",
  {
    id: serial("id").primaryKey(),
    entityType: varchar("entity_type", { length: 20 }).notNull(),
    entityId: bigint("entity_id", { mode: "number", unsigned: true }).notNull(),
    procedureNo: varchar("procedure_no", { length: 50 }),
    title: varchar("title", { length: 250 }).notNull(),
    actionDate: date("action_date", { mode: "date" }).notNull(),
    nextAction: varchar("next_action", { length: 300 }),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("idx_procedures_entity").on(t.entityType, t.entityId)],
);

/* ─────────────────────────────── الجلسات ───────────────────────────────── */

export const sessions = mysqlTable(
  "sessions",
  {
    id: serial("id").primaryKey(),
    lawsuitId: bigint("lawsuit_id", { mode: "number", unsigned: true }).references(
      () => lawsuits.id,
    ),
    executionFileId: bigint("execution_file_id", {
      mode: "number",
      unsigned: true,
    }).references(() => executionFiles.id),
    lawyerId: bigint("lawyer_id", { mode: "number", unsigned: true }).references(
      () => lawyers.id,
    ),
    sessionDate: datetime("session_date", { mode: "date" }).notNull(),
    location: varchar("location", { length: 250 }), // المحكمة المختصة / مديرية التنفيذ
    status: varchar("status", { length: 30 }).notNull().default("قادمة"), // قادمة | انعقدت | مؤجلة
    outcome: varchar("outcome", { length: 300 }),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("idx_sessions_date").on(t.sessionDate),
    index("idx_sessions_lawyer").on(t.lawyerId),
  ],
);

/* ──────────────────────────── مهام المحامين ────────────────────────────── */

export const lawyerTasks = mysqlTable(
  "lawyer_tasks",
  {
    id: serial("id").primaryKey(),
    lawyerId: bigint("lawyer_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => lawyers.id),
    lawsuitId: bigint("lawsuit_id", { mode: "number", unsigned: true }).references(
      () => lawsuits.id,
    ),
    executionFileId: bigint("execution_file_id", {
      mode: "number",
      unsigned: true,
    }).references(() => executionFiles.id),
    customerId: bigint("customer_id", { mode: "number", unsigned: true }).references(
      () => customers.id,
    ),
    taskType: varchar("task_type", { length: 100 }).notNull().default("عامة"),
    title: varchar("title", { length: 250 }).notNull(),
    description: text("description"),
    priority: varchar("priority", { length: 20 }).notNull().default("متوسطة"), // عالية | متوسطة | منخفضة
    status: varchar("status", { length: 30 }).notNull().default("قيد الانتظار"), // قيد الانتظار | قيد التنفيذ | منجزة
    dueDate: date("due_date", { mode: "date" }),
    requiredAction: varchar("required_action", { length: 300 }),
    completedAt: date("completed_at", { mode: "date" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("idx_tasks_lawyer").on(t.lawyerId),
    index("idx_tasks_due").on(t.dueDate),
  ],
);

/* ─────────────────────────────── المراسلات ─────────────────────────────── */

export const messages = mysqlTable(
  "messages",
  {
    id: serial("id").primaryKey(),
    recipientType: varchar("recipient_type", { length: 20 }).notNull(), // lawyer | customer
    recipientName: varchar("recipient_name", { length: 200 }).notNull(),
    phone: varchar("phone", { length: 30 }),
    templateKey: varchar("template_key", { length: 60 }),
    entityType: varchar("entity_type", { length: 20 }), // lawsuit | execution | task | customer | installment
    entityId: bigint("entity_id", { mode: "number", unsigned: true }),
    fileNumber: varchar("file_number", { length: 100 }),
    body: text("body").notNull(),
    channel: varchar("channel", { length: 20 }).notNull().default("whatsapp"),
    status: varchar("status", { length: 20 }).notNull().default("مفتوحة"), // مفتوحة | مسودة
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("idx_messages_entity").on(t.entityType, t.entityId)],
);

import { createRouter, publicQuery } from "./middleware";
import { authRouter } from "./auth";
import { lookupsRouter } from "./lookups";
import { customersRouter } from "./customers";
import { financeRouter, proceduresRouter } from "./finance";
import { legalRouter } from "./legal";
import { lawyersRouter, tasksRouter, sessionsRouter } from "./lawyers";
import { messagingRouter } from "./messaging";
import { reportsRouter, adminRouter } from "./reports";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  lookups: lookupsRouter,
  customers: customersRouter,
  finance: financeRouter,
  procedures: proceduresRouter,
  legal: legalRouter,
  lawyers: lawyersRouter,
  tasks: tasksRouter,
  sessions: sessionsRouter,
  messaging: messagingRouter,
  reports: reportsRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;

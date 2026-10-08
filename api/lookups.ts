import { z } from "zod";
import { eq } from "drizzle-orm";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { courts, judges, executionDirectorates } from "@db/schema";

function crud(table: any, nameField: string) {
  return {
    list: publicQuery.query(async () => getDb().select().from(table)),
    create: publicQuery
      .input(z.object({ name: z.string().min(1), courtId: z.number().optional() }))
      .mutation(async ({ input }) => {
        const values: Record<string, unknown> = { [nameField]: input.name };
        if ("courtId" in input && input.courtId) values.courtId = input.courtId;
        await getDb().insert(table).values(values);
        return { ok: true };
      }),
    update: publicQuery
      .input(z.object({ id: z.number(), name: z.string().min(1) }))
      .mutation(async ({ input }) => {
        await getDb()
          .update(table)
          .set({ [nameField]: input.name })
          .where(eq(table.id, input.id));
        return { ok: true };
      }),
    remove: publicQuery
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await getDb().delete(table).where(eq(table.id, input.id));
        return { ok: true };
      }),
  };
}

export const lookupsRouter = createRouter({
  courts: createRouter(crud(courts, "name")),
  judges: createRouter(crud(judges, "name")),
  directorates: createRouter(crud(executionDirectorates, "name")),
});

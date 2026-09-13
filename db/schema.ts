import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
export const habitats = sqliteTable("habitats", {
  id: text("id").primaryKey(),
  state: text("state").notNull(),
  revision: integer("revision").notNull().default(0),
});

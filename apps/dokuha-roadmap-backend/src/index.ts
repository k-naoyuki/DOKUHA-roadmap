import { D1Database } from '@cloudflare/workers-types';
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { users } from "../schema";
import { createUser } from "./users";

type Bindings = {
  productionDB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

/*****************************************
 * get users
 *****************************************/
app.get("/users", async (c) => {
  const db = drizzle(c.env.productionDB);
  const result = await db.select().from(users).all();
  return c.json(result);
});

/*****************************************
 * create users
 *****************************************/
app.post("/users", async (c) => {
  const params = await c.req.json<typeof users.$inferSelect>();
  const db = drizzle(c.env.productionDB);

  const result = createUser(db, params)
  return c.json(result);
});

export default app;
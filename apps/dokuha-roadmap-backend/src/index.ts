import { D1Database } from '@cloudflare/workers-types';
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { users } from "../schema";
import { createUser } from "./users";
import { DuplicateEmailError } from './errors';

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

  try {
    const userId = await createUser(db, params);
    return c.json({ success: true, userId });
  } catch (error) {
    if (error instanceof DuplicateEmailError) {
      return c.json(
        { success: false, error: error.message },
        { status: 409 }
      );
    }
    console.error('Unexpected error:', error);
    return c.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export default app;
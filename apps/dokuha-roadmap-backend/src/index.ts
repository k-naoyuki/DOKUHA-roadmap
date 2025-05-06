import { D1Database } from '@cloudflare/workers-types';
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { users, learningContents } from "../schema";
import { createUser } from "./users";
import { DuplicateEmailError } from './errors';
import { v4 as uuidv4 } from 'uuid';
import { CreateLearningContent } from '../types/learning-contents';
import { z } from 'zod';

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

/*****************************************
 * create learning content
 *****************************************/
const createLearningContentSchema = z.object({
  userId: z.string().uuid(),
  title: z.string().min(1).max(255),
  totalPage: z.number().min(1),
  currentPage: z.number().min(1).optional(),
  note: z.string().optional(),
});

app.post("/learning-contents", async (c) => {
  const db = drizzle(c.env.productionDB);
  
  try {
    const json = await c.req.json();
    const validatedData = createLearningContentSchema.parse(json);

    const newLearningContent: CreateLearningContent = {
      ...validatedData,
      currentPage: validatedData.currentPage || 1,
      note: validatedData.note || '',
    };

    await db.insert(learningContents).values({
      id: uuidv4(),
      ...newLearningContent,
    });

    return c.json({ 
      success: true,
      message: 'Learning content created successfully'
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ 
        success: false, 
        error: error.errors 
      }, { status: 400 });
    }
    
    console.error('Unexpected error:', error);
    return c.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
});

export default app;
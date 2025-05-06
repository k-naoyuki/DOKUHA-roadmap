import { D1Database } from '@cloudflare/workers-types';
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
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

/*****************************************
 * get learning contents
 *****************************************/
app.get("/learning-contents", async (c) => {
  const db = drizzle(c.env.productionDB);
  const { userId, page = '1', limit = '10' } = c.req.query();

  try {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
      return c.json({
        success: false,
        error: 'Invalid page or limit parameter'
      }, { status: 400 });
    }

    const offset = (pageNum - 1) * limitNum;

    const result = await db.select()
      .from(learningContents)
      .where(userId ? eq(learningContents.userId, String(userId)) : undefined)
      .limit(limitNum)
      .offset(offset);

    return c.json({
      success: true,
      data: result
    });

  } catch (error: unknown)
  {
    console.error('Error fetching learning contents:', error);
    if (error instanceof Error) {
        console.error(error.message);
        console.error(error.stack);
    }
    return c.json({
      success: false,
      error: 'Internal server error occurred while fetching learning contents.'
    }, { status: 500 });
  }
});

/*****************************************
 * get learning content by id
 *****************************************/
app.get("/learning-contents/:id", async (c) => {
  const db = drizzle(c.env.productionDB);
  const { id } = c.req.param();
  
  try {
    const result = await db
      .select()
      .from(learningContents)
      .where(eq(learningContents.id, id))
      .get();
    
    if (!result) {
      return c.json({ 
        success: false, 
        error: 'Learning content not found' 
      }, { status: 404 });
    }
    
    return c.json({ 
      success: true,
      data: result 
    });
  } catch (error) {
    console.error('Error fetching learning content:', error);
    return c.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
});

export default app;
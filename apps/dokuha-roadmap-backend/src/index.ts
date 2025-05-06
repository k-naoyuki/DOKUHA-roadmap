import { D1Database } from '@cloudflare/workers-types';
import { drizzle } from "drizzle-orm/d1";
import { eq, sql } from "drizzle-orm";
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
}).refine(data => {
  // currentPageが指定されている場合、totalPage以下であることを確認
  if (data.currentPage) {
    return data.currentPage <= data.totalPage;
  }
  return true;
}, { message: "現在のページは総ページ数を超えることはできません" });

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

/*****************************************
 * update learning content
 *****************************************/
const updateLearningContentSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  totalPage: z.number().min(1).optional(),
  currentPage: z.number().min(1).optional(),
  note: z.string().optional(),
}).refine(data => {
  // totalPageとcurrentPageの両方が存在する場合、currentPage <= totalPageであることを確認
  if (data.totalPage && data.currentPage) {
    return data.currentPage <= data.totalPage;
  }
  return true;
}, { message: "現在のページは総ページ数を超えることはできません" });

app.put("/learning-contents/:id", async (c) => {
  const db = drizzle(c.env.productionDB);
  const { id } = c.req.param();
  
  try {
    const existingContent = await db
      .select()
      .from(learningContents)
      .where(eq(learningContents.id, id))
      .get();
    
    if (!existingContent) {
      return c.json({ 
        success: false, 
        error: 'Learning content not found' 
      }, { status: 404 });
    }

    const json = await c.req.json();
    const validatedData = updateLearningContentSchema.parse(json);
    
    // currentPageのバリデーション（既存のtotalPageと比較）
    if (validatedData.currentPage && !validatedData.totalPage) {
      if (validatedData.currentPage > existingContent.totalPage) {
        return c.json({ 
          success: false, 
          error: '現在のページは総ページ数を超えることはできません' 
        }, { status: 400 });
      }
    }

    await db.update(learningContents)
      .set({
        ...validatedData,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(learningContents.id, id));

    const updatedContent = await db
      .select()
      .from(learningContents)
      .where(eq(learningContents.id, id))
      .get();

    return c.json({ 
      success: true,
      data: updatedContent
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ 
        success: false, 
        error: error.errors 
      }, { status: 400 });
    }
    
    console.error('Error updating learning content:', error);
    return c.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
});

/*****************************************
 * delete learning content
 *****************************************/
// TODO: 本当に物理削除でいいのかは改めて要検討（チケット作成済）
app.delete("/learning-contents/:id", async (c) => {
  const db = drizzle(c.env.productionDB);
  const { id } = c.req.param();
  
  try {
    // 存在確認
    const existingContent = await db
      .select()
      .from(learningContents)
      .where(eq(learningContents.id, id))
      .get();
    
    if (!existingContent) {
      return c.json({ 
        success: false, 
        error: 'Learning content not found' 
      }, { status: 404 });
    }

    // 削除実行
    await db.delete(learningContents)
      .where(eq(learningContents.id, id));

    return c.json({ 
      success: true,
      message: 'Learning content deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting learning content:', error);
    return c.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
});

export default app;
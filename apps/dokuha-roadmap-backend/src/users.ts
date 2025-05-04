import crypto from 'crypto-js';
import { users } from '../schema';
import { v4 as uuidv4 } from 'uuid';
import { DuplicateEmailError } from './errors';

export async function createUser(db: any, userData: any) {
  const userId = randomUUID();
  const hashedPassword = await hashPasswordFunction(userData.password);

  try {
    await db.insert(users).values({
      id: userId,
      nickname: userData.nickname,
      email: userData.email,
      password: hashedPassword,
      readingMission: userData.readingMission,
      // createdAt と updatedAt はDBのデフォルト/トリガーに任せる
    });

    console.log(`User created with ID: ${userId}`);
    return userId;
  } catch (error: any) {
    if (error.message?.includes('UNIQUE constraint failed: users.email')) {
      throw new DuplicateEmailError(userData.email);
    }
    throw error; // その他のエラーは上位層に委ねる
  }
}

async function hashPasswordFunction(password: string): Promise<string> {
    if (typeof password !== 'string' || password.length === 0) {
        throw new Error('Password must be a non-empty string.');
    }
    const salt = crypto.lib.WordArray.random(128 / 8).toString();
    const hashedPassword = crypto.PBKDF2(password, salt, {
      keySize: 256 / 32,
      iterations: 1000,
    }).toString();
    return `${salt}:${hashedPassword}`;
}

function randomUUID() {
  return uuidv4();
}


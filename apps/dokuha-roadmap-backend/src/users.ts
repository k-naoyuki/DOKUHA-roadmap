import crypto from 'node:crypto';
import { users } from '../schema';
import { DuplicateEmailError } from './errors';

// TODO: 設定として管理するのが望ましい
const HASH_ITERATIONS = 100000; // イテレーション回数を大幅に増やす (環境に応じて調整)
const HASH_KEYLEN = 64; // ハッシュのバイト長 (例: 512ビット)
const HASH_DIGEST = 'sha512'; // 使用するダイジェストアルゴリズム
const SALT_BYTES = 16; // Saltのバイト長 (128ビット)

export async function createUser(db: any, userData: any) {
  const userId = crypto.randomUUID();
  const hashedPassword = await hashPasswordFunction(userData.password);

  try {
    await db.insert(users).values({
      id: userId,
      nickname: userData.nickname,
      email: userData.email,
      password: hashedPassword,
      readingMission: userData.readingMission || "",
      // createdAt と updatedAt はDBのデフォルト/トリガーに任せる
    });

    console.log(`User created with ID: ${userId}`);
    return userId;
  } catch (error: any) {
    if (error.message?.includes('UNIQUE constraint failed: users.email') || 
        error.message?.includes('SqliteError: UNIQUE constraint failed: users.email')) { // D1のエラーメッセージ形式も考慮
      throw new DuplicateEmailError(userData.email);
    }
    console.error('Error creating user:', error);
    throw error;
  }
}

/**
 * パスワードをハッシュ化する (Node.js crypto を使用)
 * @param password 平文パスワード
 * @returns "salt(hex):hash(hex)" 形式の文字列 Promise
 */
function hashPasswordFunction(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof password !== 'string' || password.length === 0) {
      return reject(new Error('Password must be a non-empty string.'));
    }

    // Salt を生成 (Buffer)
    const salt = crypto.randomBytes(SALT_BYTES);

    // PBKDF2 ハッシュ計算 (非同期)
    crypto.pbkdf2(
      password,
      salt,
      HASH_ITERATIONS,
      HASH_KEYLEN,
      HASH_DIGEST,
      (err, derivedKey) => {
        if (err) {
          return reject(err);
        }
        // Salt と ハッシュ を 16進数文字列に変換して結合
        resolve(`${salt.toString('hex')}:${derivedKey.toString('hex')}`);
      }
    );
  });
}

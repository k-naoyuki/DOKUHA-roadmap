'use client';

import type React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';

export type postData = {
  userId: string;
  title: string;
  totalPage: number;
  currentPage: number;
  note: string;
}

export default function NewPage() {
  const [title, setTitle] = useState<string>('');
  const [totalPage, setTotalPage] = useState<number | ''>('');
  const [currentPage, setCurrentPage] = useState<number | ''>('');
  const [note, setNote] = useState<string>('');

  const router = useRouter();

  //ユーザIDはテスト用に仮置き
  //認証機能が実装されたら認証情報から取得するように修正する
  const userId = '00000000-0000-0000-0000-000000000001';

  const handleSubmit = async(event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    //TODO：この辺は適当にやってるのでちゃんと見直す
    if (!title.trim()) {
      alert('タイトルは必須入力です。');
      return;
    }

    if (totalPage === '' || Number.isNaN(Number(totalPage)) || Number(totalPage) < 1) { 
      alert('総ページ数は必須入力です。1以上の数値を入力してください。');
      return;
    }

    if (currentPage === '' || Number.isNaN(Number(currentPage)) || Number(currentPage) < 1) { 
      alert('現在のページ数は必須入力です。1以上の数値を入力してください。');
      return;
    }

    if (Number(currentPage) > Number(totalPage)) {
        alert('現在のページ数を総ページ数以下に設定してください');
        return;
    }
    const formatPOSTData: postData = {
      "userId": userId,
      "title": title,
      "totalPage": Number(totalPage),
      "currentPage": Number(currentPage),
      "note": note
    }

    try{
      const response = await fetch(`${process.env.NEXT_PUBLIC_BE_URL}learning-contents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formatPOSTData),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      //TODO：成功時のメッセージをlist画面で表示する。どうやるんだろう。要確認
      //TODO：後続タスクでURL直すのでその時にあわせて直す
      router.push('/list');
    } catch (error){
        // TODO: 適切なエラーハンドリングに置き換える
        console.log('エラーが発生しました:', error);
    }

  };

  const handleCancel = () => {
    //TODO：内容は保存されません。みたいな警告メッセージを出す。
    //TODO：後続タスクでURL直すのでその時にあわせて直す
    router.push('/list');
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h2 className="text-3xl font-bold mb-6 text-center">コンテンツ追加</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="title" className="block text-gray-700 text-sm font-bold mb-2">
            タイトル:（必須）
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="コンテンツのタイトルを入力"
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="totalPage" className="block text-gray-700 text-sm font-bold mb-2">
            ページ数:（必須）
          </label>
          <input
            type="number"
            id="totalPage"
            value={totalPage}
            onChange={(e) => {
              const value = e.target.value;
              setTotalPage(value === '' ? '' : (Number.isNaN(Number(value)) ? 0 : Number(value)));
            }}
            min="1"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="総ページ数を入力"
            required 
          />
        </div>

        <div className="mb-4">
          <label htmlFor="currentPage" className="block text-gray-700 text-sm font-bold mb-2">
            現在ページ数:（必須）
          </label>
          <input
            type="number"
            id="currentPage"
            value={currentPage}
            onChange={(e) => {
              const value = e.target.value;
              setCurrentPage(value === '' ? '' : (Number.isNaN(Number(value)) ? 0 : Number(value)));
            }}
            min="1"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="現在のページ数を入力"
            required 
          />
        </div>
        
        <div className="mb-6">
          <label htmlFor="note" className="block text-gray-700 text-sm font-bold mb-2">
            学習メモ:（任意）
          </label>
          <textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline resize-y"
            placeholder="学習メモを入力（現時点で無ければ未入力でも可）"
          />
        </div>

        <div className="flex items-center justify-end space-x-4">
          <Button
            type='button'
            name='キャンセル'
            onClick={handleCancel}
          />
          <Button
            type='submit'
            name='保存'
          />
        </div>
      </form>
    </div>
  );
}
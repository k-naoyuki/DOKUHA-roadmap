'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';

export default function EditPage() {
  const [title, setTitle] = useState<string>('');
  const [totalPage, setTotalPage] = useState<number | ''>('');
  const [note, setNote] = useState<string>('');

  const router = useRouter();

  const handleSubmit = () => {

    if (!title.trim()) {
      alert('タイトルは必須入力です。');
      return;
    }

    if (totalPage === '' || isNaN(Number(totalPage)) || Number(totalPage) < 1) { 
      alert('ページ数は必須入力です。1以上の数値を入力してください。');
      return;
    }

    //ここでPOSTする想定なのでいったん設定問題ないか確認のログ出しておく
    //TODO：POSTとばすー
    console.log('タイトル:', title);
    console.log('ページ数:', totalPage);
    console.log('フリー入力 (Note):', note);
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6 text-center">コンテンツ追加</h1>
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
            setTotalPage(value === '' ? '' : (isNaN(Number(value)) ? 0 : Number(value)));
          }}
          min="1"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          placeholder="総ページ数を入力"
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
          name='キャンセル'
          onClick={handleCancel}
        />
        <Button
          name='保存'
          onClick={handleSubmit}
        />
      </div>
    </div>
  );
}
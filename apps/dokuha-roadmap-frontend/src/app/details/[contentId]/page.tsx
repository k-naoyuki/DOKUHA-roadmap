'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import Button from "@/components/ui/Button";

export type postData = {
  currentPage: number;
  note: string;
}

export type getData = {
  userId: string;
  title: string;
  totalPage: number;
  currentPage: number;
  note: string;
}

//TODO:alertの箇所はトースト通知ないしはonBlurでやりたい
export default function DetailPage() {
  const router = useRouter();

  const { contentId } = useParams();
  const [contentTitle, setContentTitle] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPage, setTotalPage] = useState(0);
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const progress = (currentPage / totalPage) * 100;
  const clampedProgress = Math.max(0, Math.min(100, progress));

  useEffect(() => {
    const fetchContent = async () => {
      setIsLoading(true);
      try {
        if (!contentId) {
          return;
        }

        // TODO: URLにID直接指定することでほかのユーザのコンテンツが見れる＆編集できるので、clerkのトークン一緒に送ってサーバ側で検証する必要がある
        const response = await fetch(`${process.env.NEXT_PUBLIC_BE_URL}learning-contents/${contentId}`);
        if (!response.ok) {
          throw new Error('コンテンツ情報の取得に失敗しました');
        }

        const data = await response.json();
        const jsonResponse = data.data;

        setContentTitle(jsonResponse.title);
        setCurrentPage(jsonResponse.currentPage);
        setTotalPage(jsonResponse.totalPage);
        setNote(jsonResponse.note);
      } catch (error) {
        alert('エラーが発生しました。トップページに戻ります。');//TODO
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };
    fetchContent();
  }, [contentId, router]);

  const onRecordSubmit = async (e: React.FormEvent) => {

    // TODO:送信中はボタンを非活性にする。issubmittingみたいなステート
    try {
      e.preventDefault();
      if (Number.isNaN(Number(currentPage)) || Number(currentPage) < 0) {
        alert('現在のページ数は0以上の値を入力してください。');
        return;
      }

      if (currentPage > totalPage) {
        alert('現在のページ数は総ページ数よりも小さな値を入力してください。');
        return;
      }

      const formatPOSTData: postData = {
        "currentPage": Number(currentPage),
        "note": note
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_BE_URL}learning-contents/${contentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formatPOSTData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      alert('記録が保存されました。');
    } catch (error) {
      // TODO: 適切なエラーハンドリングに置き換える
      console.error('エラーが発生しました:', error);
    }
  };

  const onBackPage = () => {
    // TODO: 変更内容保存しないよ、みたいな警告だす。未編集の場合は出さないようにする？ 
    router.push('/');
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">データ読み込み中...</div>;
  }

  return (
    <div className="flex flex-col h-screen p-8 bg-gray-50 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex-grow">
          <h1 className="text-3xl font-extrabold text-gray-800">{contentTitle}</h1>
          <p className="text-lg text-gray-600 mt-2">
            <label htmlFor="currentPageInput">
            現在のページ: 
            <input
              id="currentPageInput"
              type="number"
              value={currentPage}
              onChange={(e) => {
                const value = e.target.value;
                setCurrentPage(value === '' ? 0 : (Number.isNaN(Number(value)) ? 0 : Number(value)));
              }}
              min="0"
              max={totalPage}
              className="ml-2 w-24 p-1 border border-gray-300 rounded-md text-center font-semibold text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            </label>
            <span className="ml-1"> / {totalPage}</span>
          </p>
        </div>

        <div className="w-full md:w-1/2 lg:w-1/3 flex-shrink-0">
          <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden">
            <div
              className="bg-blue-500 h-full rounded-full transition-all duration-500 ease-out flex items-center justify-center"
              style={{ width: `${clampedProgress}%` }}
            >
              <span className="text-white text-sm font-bold drop-shadow-sm">
                {clampedProgress.toFixed(0)}%
              </span>
            </div>
          </div>
          <p className="text-center text-blue-700 font-semibold mt-2">
            {progress < 25 && '始まったばかり！コツコツ頑張ろう！'}
            {progress >= 25 && progress < 75 && 'いい感じ！この調子で進めよう！'}
            {progress >= 75 && progress < 100 && 'もう少しで読了！がんばれ！'}
            {progress === 100 && 'D　O　K　U　H　A　！'}
          </p>
        </div>
      </div>

      <form onSubmit={onRecordSubmit} className="flex-grow flex flex-col bg-white p-6 rounded-lg shadow-md">
        <label htmlFor="noteTextarea" className="sr-only">記録</label>

        <textarea
          className="flex-grow w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-800"
          placeholder="ここに記録する"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <div className="mt-4 flex flex-col md:flex-row justify-end gap-3">
          <Button
            name='記録を保存'
            type='submit'
          />
          <Button
            name='戻る'
            onClick={onBackPage}
            type='button'
          />
        </div>
      </form>
    </div>
  );
}
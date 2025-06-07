'use client'

import Button from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export type LearningContent = {
    id: string;
    userId: string;
    title: string;
    totalPage: number;
    currentPage: number;
    note: string;
    createdAt: string;
    updatedAt: string;
};

export default function ListPage(){

  const [contents, setContents] = useState<LearningContent[]>([]);
  const  router = useRouter();
  
  const userId = '00000000-0000-0000-0000-000000000001';
  useEffect(()=>{
    const fetchUsers = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BE_URL}learning-contents?userId=${userId}`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setContents(data.data);
      } catch (error) {
        // TODO: 適切なエラーハンドリングに置き換える
        console.log('エラーが発生しました:', error);
      } finally {
        //TODO: あとでLoadの状態管理追加しとく
      }
    };
    fetchUsers();
  }, [])

  const handleEditClick = () => {
    //未実装
    alert('未実装だよ');
  }

  const handleDeleteClick = () => {
    //未実装
    alert('未実装だよ');
  }

  const handleAddContentClick = () => {
    //とりあえず画面遷移だけ実装。
    //TODO：追加した情報を一覧画面に反映させるのにリフレッシュとか必要かな？要確認。
    router.push('/new');
  }


  const makeList = () => {
    return (
      <div>
        <div className="flex flex-col md:flex-row items-center justify-between mb-4 space-y-4 md:space-y-0">
          <div className="w-full md:w-auto">
            <Button name='新規追加' onClick={handleAddContentClick} />
          </div>
        </div>  
        {contents.length === 0 ? (
          <p>学習コンテンツが見つかりませんでした。</p>
        ) : (
          <table className="w-full border-collapse mt-5">
            <thead>
              <tr className="bg-gray-100">
                <th>No.</th>
                <th>タイトル</th>
                <th>進捗率</th>
                <th>更新日</th>
                <th>登録日</th>
                <th>編集</th>
                <th>削除</th>
              </tr>
            </thead>
            <tbody>
              {contents.map((c, index) => {
                const progress = c.totalPage > 0 ? ((c.currentPage / c.totalPage) * 100).toFixed(1) : '0.0';
                const updateDate = new Date(c.updatedAt).toLocaleDateString('ja-JP');
                const registDate = new Date(c.createdAt).toLocaleDateString('ja-JP');

                return (
                  <tr key={c.id} className="border-b border-gray-300">
                    <td className="text-center">{index + 1}</td>
                    <td className="text-center">{c.title}</td>
                    <td className="text-center">{progress}%</td>
                    <td className="text-center">{updateDate}</td>
                    <td className="text-center">{registDate}</td>
                    <td className="text-center">
                      <Button
                        name='編集'
                        onClick={handleEditClick}
                      />
                    </td>
                    <td className="text-center">
                      <Button
                        name='削除'
                        onClick={handleDeleteClick}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    );
  }

  return (
    <div>
      {makeList()}
    </div>
  );

}
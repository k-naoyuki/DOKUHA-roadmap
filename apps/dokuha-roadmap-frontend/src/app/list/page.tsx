'use client'

import Button from "@/components/ui/Button";
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

export default function list(){

  const [contents, setContents] = useState<LearningContent[]>([]);

  const userId = '00000000-0000-0000-0000-000000000001';
  useEffect(()=>{
    const fetchUsers = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_GET_CONTENTS_URL}?userId=${userId}`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(data);
        setContents(data.data);
      } catch (error) {
        console.log('エラーが発生しました:', error);
      } finally {
        //あとでLoadの状態管理追加しとく
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

  const makeList = () => {
    return (
      <div>
        <h1>学習コンテンツリスト</h1>
        {contents.length === 0 ? (
          <p>学習コンテンツが見つかりませんでした。</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f2f2f2' }}>
                <th>No</th>
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
                  <tr key={c.id} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ textAlign: 'center' }}>{index + 1}</td>
                    <td style={{ textAlign: 'center' }}>{c.title}</td>
                    <td style={{ textAlign: 'center' }}>{progress}%</td>
                    <td style={{ textAlign: 'center' }}>{updateDate}</td>
                    <td style={{ textAlign: 'center' }}>{registDate}</td>
                    <td style={{ textAlign: 'center' }}>
                      <Button
                        name='編集'
                        onClick={handleEditClick}
                      />
                    </td>
                    <td style={{ textAlign: 'center' }}>
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
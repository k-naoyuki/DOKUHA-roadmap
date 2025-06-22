'use client';
import React from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const route = () => {
    router.push('/list');
  };

  return (
    <div>
      <button type="button" onClick={route}>
        一覧画面へ遷移
      </button>
    </div>
  );
}

'use client'

import Button from "@/components/ui/Button";

export default function ExperimentPage() {

  const onButtonClick = () => {
    console.log('ボタンがクリックされました！');
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Experiment Page</h1>
      <p className="mt-4">ここは実験用の画面です。</p>

      <Button 
        name='test'
        onClick={onButtonClick}
      />
    </div>
  );
}

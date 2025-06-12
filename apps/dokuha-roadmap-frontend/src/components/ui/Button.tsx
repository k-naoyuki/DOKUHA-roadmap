interface ButtonProps {
  type: 'button' | 'submit' | 'reset'; // ボタンの種類（必須）
  name: string; // ボタンの表示名（必須）
  onClick?: () => void; // クリック時のイベントハンドラ（必須）
  // その他の標準HTMLボタン属性を必要に応じて追加したい場合は以下のように extends する
  // extends React.ButtonHTMLAttributes<HTMLButtonElement>
}

// 仮のインラインスタイル
const buttonStyle: React.CSSProperties = {
  backgroundColor: '#007bff', // 青色の背景
  color: 'white',
  border: 'none',              // ボーダーなし
  padding: '8px 12px',         // 内側の余白
  borderRadius: '4px',         // 角を少し丸く
  cursor: 'pointer',           // マウスオーバー時にカーソルをポインタに
  fontSize: '14px',
  marginRight: '8px',          // ボタン間の右マージン (複数のボタンを並べる場合)
  whiteSpace: 'nowrap',        // ボタン内のテキストが改行されないように
};

export default function Button({type, name, onClick }: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick} // 受け取った onClick 関数をそのままボタンに渡す
      style={buttonStyle} // 定義したスタイルを適用
    >
      {name} {/* 受け取った name をボタンの表示テキストとして使う */}
    </button>
  );
}
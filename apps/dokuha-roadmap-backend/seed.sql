INSERT INTO users (
  id,
  nickname,
  email,
  password,
  reading_mission
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'テスト太郎',
  'john@example.com',
  'password123',
  'Read more books'
);

INSERT INTO learning_contents (
  id,
  user_id,
  title,
  total_page,
  current_page,
  note
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'プログラミング入門1',
  300,
  1,
  '初めてのプログラミング学習1'
),(
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'プログラミング入門2',
  300,
  1,
  '初めてのプログラミング学習2'
);

CREATE TABLE users (
	id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
	nickname VARCHAR(255) NOT NULL,
	email VARCHAR(255) UNIQUE NOT NULL,
	password TEXT NOT NULL,
	reading_mission VARCHAR(255) NOT NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
);

CREATE TABLE learning_contents (
	id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
	user_id UUID NOT NULL,
	title VARCHAR(255) NOT NULL,
	total_page INT DEFAULT 1 NOT NULL,
	current_page INT DEFAULT 1 NOT NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	note TEXT DEFAULT '' NOT NULL,
	ONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id)
);
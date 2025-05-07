CREATE TABLE `learning_contents` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`total_page` integer DEFAULT 1 NOT NULL,
	`current_page` integer DEFAULT 1 NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);

-- NOTE: 以下のTRIGGERは、$onUpdate でうまく作成できず挫折したため手動で作成している
-- まだないっぽい：https://github.com/drizzle-team/drizzle-orm/issues/843
CREATE TRIGGER `update_learning_contents_updated_at`
AFTER UPDATE ON `learning_contents` FOR EACH ROW
BEGIN
    UPDATE `learning_contents` SET `updated_at` = CURRENT_TIMESTAMP WHERE `id` = OLD.`id`;
END;
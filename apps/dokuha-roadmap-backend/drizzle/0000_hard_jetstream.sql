-- Custom SQL migration file, put your code below! --

CREATE TABLE `users` (
    `id` text PRIMARY KEY NOT NULL,
    `nickname` text NOT NULL,
    `email` text NOT NULL,
    `password` text NOT NULL,
    `reading_mission` text NOT NULL,
    `created_at` text DEFAULT CURRENT_TIMESTAMP,
    `updated_at` text DEFAULT CURRENT_TIMESTAMP
);

--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);

CREATE TRIGGER `update_users_updated_at`
AFTER UPDATE ON `users` FOR EACH ROW
BEGIN
    UPDATE `users` SET `updated_at` = CURRENT_TIMESTAMP WHERE `id` = OLD.`id`;
END;
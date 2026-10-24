ALTER TABLE `notebooks` ADD `project_id` text REFERENCES projects(id) ON DELETE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX `notebooks_projectId_idx` ON `notebooks` (`project_id`);
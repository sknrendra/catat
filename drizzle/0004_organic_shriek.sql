ALTER TABLE `backlogs` ADD `parent_id` text REFERENCES backlogs(id) ON DELETE cascade;--> statement-breakpoint
CREATE INDEX `backlogs_parentId_idx` ON `backlogs` (`parent_id`);
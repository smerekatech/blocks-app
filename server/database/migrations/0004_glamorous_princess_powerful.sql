ALTER TABLE "activities" ALTER COLUMN "color" SET DEFAULT '#64748b52';--> statement-breakpoint
UPDATE "activities" SET "color" = left("color", -2) || '52' WHERE "color" LIKE '%26';
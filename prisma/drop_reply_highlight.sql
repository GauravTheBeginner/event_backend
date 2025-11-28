-- SQL script to drop reply-to and highlight columns from chat_messages
-- Run this on your development database if you are sure you want to remove these columns.

BEGIN;

-- Drop columns (use CASCADE to remove dependent constraints/indexes)
ALTER TABLE IF EXISTS "chat_messages"
  DROP COLUMN IF EXISTS "reply_to_id" CASCADE,
  DROP COLUMN IF EXISTS "highlighted" CASCADE,
  DROP COLUMN IF EXISTS "highlighted_by_id" CASCADE,
  DROP COLUMN IF EXISTS "highlighted_at" CASCADE;

COMMIT;

-- Note: After running this script, run `npx prisma generate` to regenerate the Prisma client.
-- If you're using Prisma Migrate, you can instead run an official migration locally:
--    npx prisma migrate dev --name remove-reply-and-highlight
-- Prisma may prompt because this drop is destructive; make sure to back up your data first.

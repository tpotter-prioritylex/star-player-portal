-- EMERGENCY FIX: Remove duplicate chat channels
DELETE FROM chat_channels WHERE id NOT IN (
  SELECT MIN(id) FROM chat_channels GROUP BY name, type
);

-- Add constraint to prevent future duplicates
ALTER TABLE chat_channels DROP CONSTRAINT IF EXISTS unique_channel_name_type;
ALTER TABLE chat_channels ADD CONSTRAINT unique_channel_name_type UNIQUE (name, type, group_id);
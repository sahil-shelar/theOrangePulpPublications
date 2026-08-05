-- The tag dashboard form (src/app/dashboard/tags/TagForm.tsx) has always had a
-- Description field and submits it to createTag/updateTag, but the column was
-- never created — so every tag create/update from the dashboard failed with
-- "column description of relation tags does not exist". The failure was
-- invisible to type checking because lib/actions/tags.ts had @ts-nocheck.
--
-- categories already has this column; tags is brought in line rather than
-- dropping the field from a UI that was clearly designed to have it.
ALTER TABLE tags
  ADD COLUMN IF NOT EXISTS description TEXT;

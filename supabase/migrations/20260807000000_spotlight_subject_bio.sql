-- Spotlight subjects gain two structured biographical fields.
--
-- STRUCTURED ONLY, and the distinction is load-bearing. TMDB's free-text
-- `biography` is deliberately not stored here and is never supplied to the
-- generator: it is user-contributed, frequently stale, and unverifiable at write
-- time, so a model narrating from it would assert claims about a real person
-- that the pipeline cannot check. `birthday` and `place_of_birth` are typed
-- fields — they are rendered as data in the subject panel, never paraphrased
-- into prose. Do not read the presence of these columns as licence to feed the
-- biography to the model.
--
-- Both nullable, and commonly null: TMDB leaves them empty for many working
-- directors, so the subject panel must read correctly with only a name and role.

ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS subject_birthday   DATE,
  ADD COLUMN IF NOT EXISTS subject_birthplace TEXT;

COMMENT ON COLUMN articles.subject_birthday IS
  'Spotlight subject date of birth, from TMDB structured person fields. Never derived from free-text biography.';

COMMENT ON COLUMN articles.subject_birthplace IS
  'Spotlight subject place of birth, from TMDB structured person fields.';

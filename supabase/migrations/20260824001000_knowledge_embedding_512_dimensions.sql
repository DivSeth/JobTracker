-- Align stored semantic vectors with the hosted DashScope/Qwen 512-dimensional
-- embedding output used by the application.
--
-- Existing 384-dimensional local/prototype embeddings cannot be losslessly cast
-- to 512 dimensions, so clear them and let documents be re-ingested/regenerated
-- through the current pipeline.

UPDATE evidence_chunks SET embedding = NULL WHERE embedding IS NOT NULL;
UPDATE professional_claims SET embedding = NULL WHERE embedding IS NOT NULL;

ALTER TABLE evidence_chunks
  ALTER COLUMN embedding TYPE vector(512)
  USING NULL;

ALTER TABLE professional_claims
  ALTER COLUMN embedding TYPE vector(512)
  USING NULL;

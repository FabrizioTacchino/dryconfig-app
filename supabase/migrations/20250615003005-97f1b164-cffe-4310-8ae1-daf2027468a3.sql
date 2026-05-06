
-- Aggiungi la colonna box_pieces alla tabella materials. È integer e nullable: verrà usata solo per le viti (categoria 'screw').
ALTER TABLE public.materials ADD COLUMN box_pieces integer;

-- Commenta per chiarezza di utilizzo.
COMMENT ON COLUMN public.materials.box_pieces IS 'Numero di pezzi per scatola (usato solo per categoria screw/viti)';


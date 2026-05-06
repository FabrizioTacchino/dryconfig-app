
-- Prima verifichiamo i vincoli esistenti sulla tabella estimate_stratigraphies
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
    JOIN information_schema.referential_constraints AS rc
      ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'estimate_stratigraphies';

-- Rimuoviamo il vincolo di foreign key tra estimate_stratigraphies e stratigraphies
-- che causa la cancellazione a cascata
ALTER TABLE estimate_stratigraphies 
DROP CONSTRAINT IF EXISTS estimate_stratigraphies_stratigraphy_id_fkey;

-- Aggiungiamo un nuovo vincolo che NON cancella a cascata (NO ACTION)
-- ma solo per le stratigrafie non-snapshot
-- Per gli snapshot, stratigraphy_id può puntare a stratigrafie inesistenti
ALTER TABLE estimate_stratigraphies 
ADD CONSTRAINT estimate_stratigraphies_stratigraphy_id_fkey 
FOREIGN KEY (stratigraphy_id) 
REFERENCES stratigraphies(id) 
ON DELETE SET NULL;

-- Aggiungiamo anche un vincolo per original_stratigraphy_id che non cancella a cascata
ALTER TABLE estimate_stratigraphies 
DROP CONSTRAINT IF EXISTS estimate_stratigraphies_original_stratigraphy_id_fkey;

ALTER TABLE estimate_stratigraphies 
ADD CONSTRAINT estimate_stratigraphies_original_stratigraphy_id_fkey 
FOREIGN KEY (original_stratigraphy_id) 
REFERENCES stratigraphies(id) 
ON DELETE SET NULL;

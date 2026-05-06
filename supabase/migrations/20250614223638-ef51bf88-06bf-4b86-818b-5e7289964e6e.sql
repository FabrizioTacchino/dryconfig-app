
-- 1. Aggiungi il campo list_price (prezzo di listino) alla tabella materials
ALTER TABLE materials ADD COLUMN list_price numeric;

-- 2. Copia i valori esistenti da unit_price verso list_price per mantenere retrocompatibilità
UPDATE materials SET list_price = unit_price;

-- 3. D'ora in poi useremo unit_price come prezzo SCONTATO applicando la formula:
-- unit_price = list_price * (1 - (discount/100))
-- Quindi durante inserimento e modifica servirà questa logica nel codice!

-- 4. (Opzionale, ma utile per chiarezza futura): aggiungi un commento al campo unit_price
COMMENT ON COLUMN materials.unit_price IS 'Prezzo effettivo a noi riservato, calcolato da list_price - discount';

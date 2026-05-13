# Prompt da usare con Claude

## Inizio sessione (da un altro PC)

Copia-incolla questo all'inizio di una nuova chat Claude Code:

> Ciao Claude. Prima di iniziare leggi il vault Obsidian in `Volt/VoltDryconfig/`, comincia da `00_HOME.md` e segui i link rilevanti per il task di oggi. **Task di oggi**: [DESCRIVI QUI COSA VUOI FARE]. Dopo aver letto, dimmi se hai abbastanza contesto o cosa ti manca. Mantieni il vault aggiornato man mano che lavoriamo.

## Fine sessione

Copia-incolla questo prima di chiudere:

> Aggiorna il vault Obsidian: (1) crea il file di sessione di oggi in `07_SESSIONS/YYYY-MM-DD.md` con riassunto di cosa abbiamo fatto, file modificati, decisioni prese, e cosa resta da fare; (2) aggiorna `06_TASKS/active.md` con lo stato corrente; (3) se abbiamo risolto un bug, aggiungi un file in `04_BUGS/` con root cause e fix; (4) se è emersa una "regola" da non dimenticare, aggiungila in `08_GOTCHAS/`; (5) aggiorna `00_HOME.md` se hai aggiunto file nuovi.

## Comandi rapidi

- **"Stato del progetto"** → Claude legge `00_HOME.md`, `06_TASKS/active.md` e l'ultima sessione in `07_SESSIONS/`.
- **"Spiegami come funziona X"** → Claude legge il file rilevante in `03_FEATURES/` o `02_ARCHITECTURE/`.
- **"Perché abbiamo deciso Y?"** → Claude cerca in `05_DECISIONS/`.
- **"Bug Z, da dove inizio?"** → Claude cerca in `04_BUGS/` se l'abbiamo già visto.

## Regole per Claude

- **Mai duplicare codice nel vault** — il vault contiene spiegazioni, decisioni, gotchas. Il codice sta in `src/`.
- **Mai duplicare il contenuto di `CLAUDE.md`** — quello è un riassunto operativo per il CLI; il vault è il second brain narrativo.
- **Aggiorna i gotchas quando trovi una "trappola"** — qualcosa di non-ovvio che ha causato un bug, che potrebbe ripetersi.
- **File di sessione brevi** — bullet point, link ai file, max 1 schermata. Servono per recap, non come diario.

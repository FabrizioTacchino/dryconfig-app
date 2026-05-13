# Cos'è DryConfig

**DryConfig** è un'app web per la **configurazione e preventivazione di stratigrafie in cartongesso** (pareti a secco + controsoffitti). Vuole diventare un prodotto SaaS commerciale, alternativa a *Saint-Gobain MyPlanner* ma **multi-fornitore**.

## Differenziazione

Il MyPlanner è agganciato al catalogo Saint-Gobain. DryConfig invece:

- L'utente importa i listini di **Knauf**, **Saint-Gobain**, **Fassa Bortolo**, **Siniat**, **Rigips**, ecc.
- Sconti riservati dell'utente vengono applicati automaticamente (per famiglia + extra per materiale)
- Libreria stratigrafie certificate **multi-brand**, non solo di un produttore
- Calcoli tecnici trasparenti (EI, Rw, λ)
- Preventivazione professionale + esportazione RDA cantiere

## Target

- Cartongessisti (impresa singola o piccola squadra)
- Piccole/medie imprese di costruzione
- Studi di architettura
- Distributori di materiali

## Mercato

**Italia per primo**, poi espansione internazionale via:
- i18n (una sola app, no cloni — vedi [[../05_DECISIONS/2026-05-06-multi-lingua-no-cloni|decisione]])
- Tabella `regulations` per normative paese-specifiche

## Tone & UX

- **Lingua codice**: inglese (variabili + commenti)
- **Lingua UI**: italiano
- L'utente target **non è un developer**: deve vedere sempre il prezzo finale **netto, già scontato** (sconti famiglia + extra). Niente "listino" in chiaro tranne come riferimento barrato per mostrare il risparmio.

## Owner

**Fabrizio Tacchino** (`fabrizio.tacchino@gmail.com`). Sviluppa full-time con Claude. Comunica in italiano. Viene da Lovable, ora su Claude Code.

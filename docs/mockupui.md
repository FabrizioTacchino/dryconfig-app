# DryConfig V2 — Mockup UI del Configuratore Stratigrafie

> **Documento di design del cuore dell'app.** Ultimo aggiornamento: 2026-05-08.
>
> Questo file descrive a parole, in modo prescrittivo, ogni schermata, componente, stato, micro-interazione e palette grafica del **nuovo configuratore di stratigrafie pareti a secco**. È il riferimento di verità per l'implementazione e va aggiornato man mano che cambiano scelte.

---

## Indice

1. [Vision e principi guida](#1-vision-e-principi-guida)
2. [Architettura informazioni](#2-architettura-informazioni)
3. [Layout Desktop (≥1280px)](#3-layout-desktop-1280px)
4. [Layout Tablet (768–1279px)](#4-layout-tablet-7681279px)
5. [Layout Mobile (<768px)](#5-layout-mobile-768px)
6. [Header configuratore](#6-header-configuratore)
7. [Pannello sinistro — Lista layer](#7-pannello-sinistro--lista-layer)
8. [Combobox di selezione materiali](#8-combobox-di-selezione-materiali)
9. [Pannello destro — Tab Sezione (preview SVG)](#9-pannello-destro--tab-sezione-preview-svg)
10. [Pannello destro — Tab Pianta](#10-pannello-destro--tab-pianta)
11. [Pannello destro — Tab Costi](#11-pannello-destro--tab-costi)
12. [Pannello destro — Tab Riepilogo tecnico](#12-pannello-destro--tab-riepilogo-tecnico)
13. [Box prestazioni](#13-box-prestazioni)
14. [Sistema di design grafico](#14-sistema-di-design-grafico)
15. [Tipografia, spaziature, breakpoint](#15-tipografia-spaziature-breakpoint)
16. [Stati: empty, loading, error, validation](#16-stati-empty-loading-error-validation)
17. [Animazioni e micro-interazioni](#17-animazioni-e-micro-interazioni)
18. [Codice sistema auto-generato](#18-codice-sistema-auto-generato)
19. [Quick-add da template](#19-quick-add-da-template)
20. [Esportazione PDF stile catalogo](#20-esportazione-pdf-stile-catalogo)
21. [Accessibilità](#21-accessibilità)
22. [Mappatura componenti React previsti](#22-mappatura-componenti-react-previsti)

---

## 1. Vision e principi guida

> «Il primo editor visuale live di pareti a secco italiano. Ogni layer che aggiungi viene disegnato in tempo reale come una scheda tecnica Knauf, con prestazioni calcolate e codice sistema generato.»

**Principi non negoziabili:**

1. **Vedere prima di credere.** Ogni modifica nel form aggiorna il preview SVG entro 100ms. Niente bottoni "Aggiorna anteprima".
2. **Linguaggio del cartongessista.** Codici tipo `DC-W112-RW54-EI60`, colori imitativi della carta vera delle lastre, sezione orizzontale stile catalogo.
3. **Zero attriti.** Snap automatico su spessori commerciali, suggerimenti automatici (montante 75 → guida 75 abbinata → vite TN35 corretta), nessun campo cieco.
4. **Sempre reversibile.** Drag & drop, undo (Ctrl+Z), nessuna conferma per azioni "leggere" (sposta, modifica spessore), conferma solo per "elimina layer non vuoto".

---

## 2. Architettura informazioni

Il configuratore è organizzato in **3 zone funzionali**, sempre presenti su qualsiasi viewport (cambia solo il modo di esporle):

```
┌──────────────────────────────────────────────────────────────┐
│  HEADER  (identità + azioni)                                  │
├──────────────────────┬───────────────────────────────────────┤
│  COMPOSIZIONE        │  VISUALIZZAZIONE                       │
│  (form, layer list)  │  (preview, prestazioni, costi)         │
└──────────────────────┴───────────────────────────────────────┘
```

**Header** (sempre in alto, sempre visibile)
- Identità della stratigrafia (nome, codice, tipologia, fornitore filtrato)
- Azioni globali (salva, duplica, elimina, esporta)

**Composizione** (input — l'utente lavora qui)
- Lista ordinata dei layer (drag&drop)
- Aggiungi layer
- Note tecniche libere

**Visualizzazione** (output — l'utente capisce qui)
- Preview SVG (sezione/pianta)
- Box prestazioni (EI, Rw, λ, peso)
- Riepilogo costi

---

## 3. Layout Desktop (≥1280px)

### Schema

```
┌──────────────────────────────────────────────────────────────────────┐
│ Top bar app (sidebar a sx, header con org)                            │
├──────────────────────────────────────────────────────────────────────┤
│ ConfiguratorHeader                                                    │
│ [←] Parete Cucchi                                  [💾 Salva] [⋯]    │
│      DC-W112-RW54-EI60 · Parete divisoria · Saint Gobain (filtrato)  │
├───────────────────────────────────┬──────────────────────────────────┤
│ COMPOSIZIONE (40% — min 480px)    │ VISUALIZZAZIONE (60%, sticky)    │
│                                   │                                  │
│ [+ Aggiungi sistema certificato]  │ [Sezione | Pianta | Costi | Tec] │
│ [+ Aggiungi layer da zero]        │                                  │
│                                   │ ┌──────────────────────────────┐ │
│ ─── Lato A (esterno) ───          │ │                              │ │
│  ┌────────────────────────────┐   │ │   Preview SVG sezione        │ │
│  │ ☰  Lastra Wallboard 13     │   │ │   (vedi dettaglio §9)        │ │
│  │   Saint Gobain · 12.5 mm   │   │ │                              │ │
│  │   €1,96/m² · standard      │   │ └──────────────────────────────┘ │
│  │                       [⋯]  │   │                                  │
│  └────────────────────────────┘   │ ┌──────────────────────────────┐ │
│                                   │ │ BOX PRESTAZIONI              │ │
│ ─── Struttura ───                 │ │ ┌─────┬─────┬─────┬────────┐ │ │
│  ┌────────────────────────────┐   │ │ │ EI  │ Rw  │  λ  │ Peso   │ │ │
│  │ ☰  Montante 75 DIN         │   │ │ │ 60' │54dB │0.04 │ 25 kg  │ │ │
│  │   + Guida 75 abbinata      │   │ │ └─────┴─────┴─────┴────────┘ │ │
│  │   Saint Gobain · 75 mm     │   │ └──────────────────────────────┘ │
│  │   €2,38/ml · interasse 600 │   │                                  │
│  └────────────────────────────┘   │ ┌──────────────────────────────┐ │
│  ┌────────────────────────────┐   │ │ COSTO TOTALE     €23,50/m²   │ │
│  │ ☰  Isover lana roccia      │   │ │  Materiali   €15.20/m²       │ │
│  │   60 mm · Isover           │   │ │  Manodopera  €5.40/m² (12')  │ │
│  │   €4,12/m²                 │   │ │  Viti        €0,12/m² (17pz) │ │
│  └────────────────────────────┘   │ │  Sfrido +disc.  €2,78/m²     │ │
│                                   │ └──────────────────────────────┘ │
│ ─── Lato B (interno) ───          │                                  │
│  ┌────────────────────────────┐   │                                  │
│  │ ☰  Lastra Wallboard 13     │   │                                  │
│  │   ...                      │   │                                  │
│  └────────────────────────────┘   │                                  │
│                                   │                                  │
│ [+ Aggiungi layer]                │                                  │
│                                   │                                  │
│ ▼ Note tecniche (collassabile)    │                                  │
│   Textarea libera 3 righe         │                                  │
└───────────────────────────────────┴──────────────────────────────────┘
```

### Misure precise

- **Container outer**: `max-w-screen-2xl` (1536px), padding `p-6`.
- **Header**: altezza fissa 80px, sfondo bianco, bordo sotto sottile (`border-b border-zinc-200`).
- **Grid principale**: `grid grid-cols-[minmax(480px,40fr)_minmax(0,60fr)] gap-6`.
- **Composizione**: scroll proprio se eccede viewport.
- **Visualizzazione**: `position: sticky; top: 96px` (header app + ConfiguratorHeader).
- **Spacing layer**: gap `12px` tra card layer.
- **Card layer**: padding interno `12px`, bordo `1px solid zinc-200`, radius `8px`, hover ombra `shadow-sm`.

### Comportamento sticky

Il pannello destro è sticky, ma se la finestra è troppo bassa per contenere preview + 2 box, il preview rimane in cima e i box scrollano sotto. Niente pannelli destri annegati in basso.

---

## 4. Layout Tablet (768–1279px)

Stesso schema desktop ma:

- Grid `grid-cols-[minmax(380px,45fr)_minmax(0,55fr)]` (più spazio al form).
- Padding container `p-4`.
- Header: codice sistema su una sola riga (più compatto).
- Box prestazioni: 2×2 grid invece di 1×4.

---

## 5. Layout Mobile (<768px)

**Niente stack verticale**. Pattern a **3 tab fissi in alto** (sotto al header app):

```
┌─────────────────────────────────────────┐
│ Top bar app                              │
├─────────────────────────────────────────┤
│ ConfiguratorHeader (compatto)            │
│ [←] Parete Cucchi                        │
│ DC-W112 · Parete · €23,50/m²            │
├─────────────────────────────────────────┤
│ ╔═════════╗┌─────────┐┌────────┐         │
│ ║Configura║│Anteprima││ Costi  │ ◀ tab  │
│ ╚═════════╝└─────────┘└────────┘         │
├─────────────────────────────────────────┤
│                                          │
│  Tab attiva (full width)                 │
│  - Configura: lista layer scrollabile    │
│  - Anteprima: SVG + box prestazioni      │
│  - Costi: breakdown                      │
│                                          │
│                                          │
│                                          │
├─────────────────────────────────────────┤
│ [+ Aggiungi]   floating button           │
└─────────────────────────────────────────┘
```

**Regole mobile:**
- Tab persistenti in `position: sticky; top: 56px`.
- Floating Action Button (FAB) `+` in basso a destra (Material-style) per "Aggiungi layer", solo nella tab "Configura".
- Card layer occupa tutta larghezza, drag handle sul lato sinistro.
- Combobox materiali: full-screen modal su mobile (più spazio per fuzzy search).

---

## 6. Header configuratore

### Elementi (da sinistra a destra)

1. **BackButton** (icona freccia + label "Indietro" o "Torna ai preventivi")
2. **Identità stratigrafia** (blocco verticale)
   - Riga 1: **Nome** (modificabile inline al click — input appare al posto del testo, salva on blur o Enter)
   - Riga 2: **Metadata** (font sm, muted)
     - `DC-W112-RW54-EI60` (codice sistema, badge mono, tooltip "Codice generato automaticamente")
     - `· Parete divisoria` (tipologia auto-rilevata, badge tenue)
     - `· Saint Gobain` (filtro fornitore se attivo, badge primary)
3. **Spacer** (flex-grow)
4. **Filtro fornitore** (dropdown "Tutti i fornitori" o "Saint Gobain", "Knauf", "Fassa Bortolo", + "Solo i miei")
5. **Salva** (button primary, icona disco)
   - Stato `idle`: "💾 Salva"
   - Stato `dirty`: "💾 Salva •" (puntino arancione = ci sono modifiche)
   - Stato `saving`: spinner + "Salvataggio…"
   - Stato `saved`: ✓ verde per 2 secondi, poi torna idle
6. **Menu kebab** `[⋯]` con: Duplica, Elimina, Esporta PDF, Esporta Excel, Cronologia versioni

### Empty state header (nuova stratigrafia non ancora salvata)

```
[←] [campo nome con placeholder "Es. Parete divisoria 75"]
    DC-NEW · in attesa
```

### Stato di errore (es. nome vuoto al save)

```
[←] [campo nome bordo rosso] ← Nome obbligatorio
    Codice non generato finché manca il nome
```

---

## 7. Pannello sinistro — Lista layer

### Struttura "tre zone" (con header semantico)

I layer sono raggruppati visivamente in 3 zone:

```
─── Lato A (esterno) ───          ◀ se tipologia=parete
─── Struttura ───                 ◀ sempre
─── Lato B (interno) ───          ◀ se tipologia=parete

oppure per controsoffitto:
─── Sotto (a vista) ───
─── Struttura ───
─── Sopra (verso solaio) ───
```

Le zone sono **etichette divisorie**, non box separati: i layer fluiscono tra zone con drag & drop.

### Card layer (anatomia)

```
┌────────────────────────────────────────────┐
│ ☰ │ [icon]  Lastra Wallboard 13         [⋯]│
│   │        Saint Gobain · GKB tipo A         │
│   │ ─────────────────────────────────────   │
│   │ Spessore  [12.5 ▾] mm    Fisso/Variab.  │
│   │ Costo:    €1,96/m² (sconto 77.10%)      │
│   │ ─────────────────────────────────────   │
│   │ ▾ Vite associata: TN25 · 17/m² · €0.12  │
└────────────────────────────────────────────┘
```

**Anatomia in dettaglio:**

- **Drag handle** (`☰`): area 24×100% sx, icon Lucide `GripVertical`. Cursor `grab` su hover, `grabbing` durante drag. Scuro su hover.
- **Icon categoria**: piccola icona colorata che identifica il tipo (lastra/montante/guida/isolante/vite). Vedi colori §14.
- **Titolo**: nome del materiale, font medium 14pt. Click apre il combobox di selezione (vedi §8).
- **Sottotitolo**: fornitore + classificazione tecnica (es. `GKB tipo A`, `H1 idro`, `DFIR`).
- **Menu kebab**: Duplica layer, Elimina, Sposta su, Sposta giù, Convertisci a "fisso/variabile".
- **Spessore**: input numerico con dropdown valori commerciali (snap). Toggle `Fisso` (es. lastra 12.5 mm fissi) / `Variabile` (es. isolante 60 mm modificabile).
- **Costo riga**: prezzo netto + badge sconto se applicabile.
- **Vite associata** (solo per layer board, accordion sotto): mostra vite selezionata, quantità/m², costo/m². Click espande la sezione viti completa (riusa l'attuale logica del LayerScrewSelector).

### Stati della card

| Stato | Aspetto |
|---|---|
| **Default** | Bordo zinc-200, sfondo bianco |
| **Hover** | Bordo zinc-300, ombra `shadow-sm`, kebab visibile |
| **Selected** (clic per evidenziare nel preview) | Bordo `primary-500`, sfondo `primary-50` |
| **Drag origin** | Opacità 0.4 |
| **Drag over (drop target)** | Bordo `primary-500` tratteggiato 2px |
| **Incompleto** (no materiale o thickness=0) | Bordo `red-300`, badge "⚠ Incompleto" in alto a destra |
| **Auto-suggerito** | Badge tenue "🎯 Auto" sui materiali generati da suggerimento |

### Drag & drop

- Libreria: `@dnd-kit/sortable`.
- Drag handle solo `☰` (non l'intera card — evita drag accidentali quando si clicca per modificare).
- Durante drag: ghost translucido che segue il cursore, posto reale prende ombra interna `inset shadow`.
- Cross-zone drop: alla fine del drag, se il layer cambia zona (es. una lastra dalla "Struttura" alla "Lato A") appare toast "Spostato in Lato A".

### Bottoni di azione

Sotto la lista:

- `[+ Aggiungi layer]` (button outline, full width)
  - Click apre il combobox materiali (vedi §8) con focus search
- `[+ Aggiungi sistema certificato]` (button secondary, full width, in alto)
  - Click apre dialog "Scegli sistema da template" (vedi §19)

### Note tecniche (sotto i layer)

Accordion collassabile, default chiuso:

```
▶ Note tecniche
    [textarea 4 righe libere]
```

Le note vengono incluse nell'export PDF e nella RDA cantiere.

---

## 8. Combobox di selezione materiali

Appare in modal/popover quando l'utente clicca su un layer per cambiare materiale o `+ Aggiungi layer`.

### Anatomia

```
╔══════════════════════════════════════════════════╗
║  🔍 Cerca materiale (codice, nome, fornitore)... ║
╚══════════════════════════════════════════════════╝

[Lastre] [Isolanti] [Profili] [Viti] [Tutti]    ◀ Tab categoria

┌─── FILTRI LATERALI ─────┬─── RISULTATI ────────┐
│ Fornitore               │ ▸ Gyproc Wallboard 13│
│ ☑ Saint Gobain (758)    │   GKB · A · 12.5 mm  │
│ ☐ Isover (15)           │   €1,96/m² · 77.10%  │
│ ☐ Knauf (0)             │ ─────────────────────│
│ ☐ DryCore (16)          │ ▸ Gyproc 4PRO        │
│                         │   GKB · A · 12.5 mm  │
│ Spessore                │   €2,16/m² · 77.10%  │
│ ◯ < 10 mm               │ ─────────────────────│
│ ● 10-15 mm (45)         │ ▸ Gyproc Hydro 13    │
│ ◯ 15-20 mm              │   GKI · H1 · 12.5 mm │
│ ◯ > 20 mm               │   €4,82/m² · 25.75%  │
│                         │                      │
│ Tipo materiale          │ [scroll virtuale]    │
│ ☐ Standard (GKB)        │                      │
│ ☑ Idro (GKI)            │                      │
│ ☐ Ignifuga (GKF)        │                      │
│ ☐ Alta densità          │                      │
│                         │                      │
│ EN 520                  │                      │
│ ◯ A · ◯ DF · ◉ H1 · ◯ R │                      │
│                         │                      │
│ [Reset filtri]          │                      │
└─────────────────────────┴──────────────────────┘

[Annulla]                             [Inserisci ▸]
```

### Specifiche

- Libreria base: `cmdk` (lo stesso che usa shadcn-ui Command).
- Width modal: 800px su desktop, full screen su mobile.
- Fuzzy search: cerca su `code`, `name`, `supplier`, `material_type`, `family_code`.
- Filtri: facets calcolati dinamicamente sui risultati (count tra parentesi cambia).
- **Tab "Preferiti" (futuro)**: una pre-selezione cucita dall'admin dell'org (es. "Lastre standard B4T", "Isolanti che uso sempre").
- Ordinamento: per default per **rilevanza match** + boost se è dell'org corrente o del fornitore filtrato a livello configuratore.
- **Riga risultato** mostra:
  - Nome del materiale
  - Sotto: classificazione tecnica (es. `GKB · A · 12.5 mm`, `Lana roccia · ρ 33 kg/m³`)
  - Sotto: prezzo netto + sconto totale (badge giallo se applicabile)
  - Sulla destra: hover preview di colore/pattern del materiale (mini-rettangolo)

### Comportamento

- **Tab "Lastre"** (per default quando aggiungi un layer board): pre-filtra `category IN ('board')`.
- **Tab "Profili"** filtra `('structure_frame', 'structure_guide')`.
- **Esc** chiude. **Enter** seleziona la prima riga.
- **↑↓** naviga, **Tab** salta tra search/filters/list.

---

## 9. Pannello destro — Tab Sezione (preview SVG)

### Tab strip

```
[📐 Sezione] [📋 Pianta] [💰 Costi] [📊 Tecnico]
```

Sezione è la default.

### Layout SVG

Vista in **sezione orizzontale** stile catalogo Knauf W11x:

```
                                                   spessore tot. 125 mm
       ┌──┬─────────┬──────────┬─────────┬──┐
   12.5│  │░░░░░░░░░│≈≈≈≈≈≈≈≈≈≈│░░░░░░░░░│  │
   →   │  │░░GKB░░░│≈ Lana  ≈│░░GKB░░░│  │  ← 12.5
       │  │░░░░░░░░░│≈roccia ≈│░░░░░░░░░│  │
       │  │░░░░░░░░░│≈ 60 mm ≈│░░░░░░░░░│  │
       │  │•   •   •│         │•   •   •│  │ ← viti TN25 17/m²
       │  │  •   •  │  ┌─C─┐  │  •   •  │  │
       │  │•   •   •│  │   │  │•   •   •│  │ ← profilo C 75
       │  │  •   •  │  └───┘  │  •   •  │  │
       │  │•   •   •│         │•   •   •│  │
       │  │░░░░░░░░░│≈≈≈≈≈≈≈≈≈│░░░░░░░░░│  │
       └──┴─────────┴──────────┴─────────┴──┘
       ←12.5→  ←─ 75 ─→     ←12.5→
        Wallboard 13   Lana roccia 60   Wallboard 13
```

### Specs grafiche

**Scala**: fissa **2 px/mm** (default). Zoom 0.5x — 5x con controlli `−` `+` `100%` (fit) e scroll-wheel + Ctrl.

**Viewport**: `<svg>` width 100% del pannello, height auto.

**Margini**:
- Top: 32px (per quote sopra)
- Right: 80px (per quota totale)
- Bottom: 24px (per nomi materiali)
- Left: 24px

**Layer rendering** (da sinistra a destra, secondo l'ordine della lista):

1. **Lastre cartongesso**: rettangolo riempito con colore imitativo (vedi §14), bordo `#1F2937` 0.6px continuo.
   - Pattern di sfondo opzionale: testo verticale leggero dentro (rotato -90°) `Wallboard 13` se la larghezza > 25mm.
2. **Profili metallici (montanti)**: forma C disegnata come `<path>` reale
   - Esempio montante 75 mm × 50 mm anima, lamiera 0.6 mm:
     ```
     ┌───────┐  ← anima 50 mm
     │       │
     │       │  ← profondità 75 mm
     │       │
     └───────┘
     ```
   - Disegnato come polilinea che entra, scende, gira a sx, sale, esce.
3. **Profili metallici (guide)**: forma U disegnata sopra/sotto la struttura nella vista sezione, ma normalmente sono fuori dal piano di sezione orizzontale (sono trasversali). Per chiarezza, **nella vista sezione le guide non si vedono** — appariranno solo nella vista pianta (o come piccolo simbolo bordo top/bottom).
4. **Lana minerale** (in mezzo ai montanti): pattern SVG sinusoidale "matassa" giallo lana, riempie lo spazio interno della struttura.
5. **Viti**: piccoli cerchi neri pieni Ø 1.5mm distribuiti sul layer board ogni N mm (interasse). Solo se layer board ha `screwQuantity > 0`.

### Quote dimensionali

- **Sopra ogni layer**: linea di estensione dal bordo + tratto orizzontale + valore in mm font sans 9pt.
- **Quota totale** in basso a destra in box: "**Spessore totale: 125 mm**".
- **Etichette materiali**: sotto ogni layer, font sans 10pt, allineati al centro del layer. Truncate con `...` se troppo lungo (hover tooltip per nome completo).

### Controlli zoom (in alto a destra del SVG)

```
[−] [100%] [+] [⛶]   ← reset / fit
```

### Layer selezionato (highlight)

Quando l'utente clicca su una card layer nella lista a sinistra, il rettangolo corrispondente nel preview SVG ha **bordo blu spesso 2px** + **leggera saturazione** del colore. Click fuori deseleziona.

### Empty state

Se non ci sono layer:

```
┌────────────────────────────────────────┐
│                                        │
│           [icon parete vuota]           │
│                                        │
│    Inizia ad aggiungere i primi layer  │
│        dalla colonna a sinistra         │
│                                        │
│         [+ Aggiungi sistema W112]      │
│                                        │
└────────────────────────────────────────┘
```

---

## 10. Pannello destro — Tab Pianta

Vista dall'alto della parete con interasse montanti visibile.

```
                  ←─── 600 mm ───→  (interasse)
┌──────────┐──────┐──────┐──────┐──────┐──────┐──────┐──────┐
│GKB 12.5  │██████│██████│██████│██████│██████│██████│██████│
│GKB 12.5  │██████│██████│██████│██████│██████│██████│██████│
├──────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┤
│  lana    │ C75  │ lana │ C75  │ lana │ C75  │ lana │ C75  │
│  60 mm   │      │      │      │      │      │      │      │
│  ↕       │      │      │      │      │      │      │      │
├──────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┤
│GKB 12.5  │██████│██████│██████│██████│██████│██████│██████│
│GKB 12.5  │██████│██████│██████│██████│██████│██████│██████│
└──────────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┘
   ←─ 12.5×2 ─→ ←50→  ←─60─→ ←50→  ←─60─→ ...
```

In questa vista i **montanti C** sono dei rettangolini visibili, l'isolante è il riempimento tra di loro, e l'interasse è quotato sopra (default 600 mm, modificabile).

Slider in alto: `Interasse: [400 ▬▬●▬▬ 600]  mm`.

---

## 11. Pannello destro — Tab Costi

Breakdown dettagliato di tutti i costi, in stile fattura:

```
COSTO TOTALE                                €23,50/m²
────────────────────────────────────────────────────────
MATERIALI                                   €15,20/m²
  Gyproc Wallboard 13 ×2     12.5×2 mm    €3,92/m²
    Sconto Famiglia: 77.10%
  Montante 75 0.8 + Guida 75            €3,12/ml
    Incidenza: 0.83 ml/m²                 €2,59/m²
  Isover lana di roccia      60 mm         €4,12/m²
  Gyproc Wallboard 13        12.5 mm       €1,96/m²
  Sfrido 10% + Discarica 4%                €2,61/m²

VITI                                        €0,12/m²
  TN25 punta chiodo          17 viti/m²    €0,0070/pz
  €0,0070 × 17 viti                        €0,12/m²

MANODOPERA (12 min/m² × €30/h)              €5,40/m²
  Lastre x 2 facce                          8 min/m²
  Struttura                                  3 min/m²
  Isolante                                   1 min/m²

POSA TOTALE                                 12 min/m²
                                           = 0,20 ore/m²
────────────────────────────────────────────────────────
TOTALE NETTO STRATIGRAFIA                  €23,50/m²

Per 50 m² di superficie:
TOTALE NETTO                              €1.175,00
```

**Variabili modificabili in alto:**
- Costo orario manodopera: `€30/h` (input)
- Sfrido %: `10%` (input)
- Discarica %: `4%` (input)

I valori si applicano a tutti i layer e ricalcolano live.

---

## 12. Pannello destro — Tab Riepilogo tecnico

Tabella tecnica stile scheda Knauf:

```
╔════════════════════════════════════════════════════╗
║ DC-W112-RW54-EI60                                  ║
║ Parete divisoria a doppia orditura                 ║
╚════════════════════════════════════════════════════╝

PRESTAZIONI
┌──────────────────────────────────────────────────┐
│ Resistenza al fuoco       EI 60'                 │
│ Potere fonoisolante       Rw = 54 dB             │
│ Trasmittanza termica      U = 0.42 W/m²K         │
│ Conducibilità lana        λ = 0.040 W/mK         │
│ Massa superficiale        25 kg/m²               │
│ Altezza max ammissibile   4.5 m                  │
│ Reazione al fuoco         A2-s1,d0               │
└──────────────────────────────────────────────────┘

CARATTERISTICHE COSTRUTTIVE
┌──────────────────────────────────────────────────┐
│ Lastre lato A             2× Gyproc Wallboard 13 │
│ Orditura metallica        Montante 75 0.6        │
│                           Interasse 600 mm        │
│ Isolante                  Isover lana 60 mm      │
│                           ρ = 33 kg/m³            │
│ Lastre lato B             2× Gyproc Wallboard 13 │
│ Spessore totale           125 mm                  │
│ Tipologia                 GKB / EN 520 tipo A    │
└──────────────────────────────────────────────────┘

NOTE DI POSA
- Penetrazione viti ≥ 10 mm (UNI 11424:2015)
- Interasse viti: 250 mm in campo, 200 mm sui bordi
- Giunti sfalsati ≥ 600 mm tra primo e secondo strato
- Sigillatura perimetrale con guarnizione comprimibile
```

I valori EI/Rw/λ inizialmente saranno **stime calcolate** (formule semplificate). In futuro: lookup nella tabella `certifications` (oggi vuota) per stratigrafie certificate ufficiali.

---

## 13. Box prestazioni

Sempre visibile nel pannello destro sotto il preview, anche fuori dalla tab "Tecnico".

### Anatomia

```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│  EI          │  Rw          │  λ           │  Peso        │
│              │              │              │              │
│  60'         │  54 dB       │  0.040 W/mK  │  25 kg/m²    │
│  resistenza  │  fonoisol.   │  conducib.   │  superficiale│
│  fuoco       │              │              │              │
│  [stima]     │  [stima]     │  [stima]     │  [calc.]     │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

- Card: bordo `1px zinc-200`, padding `12px`, radius `8px`.
- Valore in font medium 24pt, colore `zinc-900`.
- Label sopra: font sm 11pt, colore `zinc-500`.
- Sub-label sotto: font xs 10pt, colore `zinc-400`.
- Badge `[stima]` arancione sm se è una stima, `[certificato]` verde se è certificato dal produttore (lookup table `certifications`).

### Tooltip al hover

Hover su EI mostra: "Resistenza al fuoco stimata in base alle classi REI dei materiali. Per certificazione ufficiale, scegli un sistema certificato Knauf/Saint-Gobain dal template."

Hover su Rw: "Stima da formula massa-molla-massa. Variazione ±3 dB rispetto al test in opera. Vedi `docs/DECISIONS.md` § acoustic."

---

## 14. Sistema di design grafico

### Color palette materiali (imitativa, leggibile a piccola scala)

| Materiale | Hex | Note |
|---|---|---|
| Lastra GKB standard | `#F5F1E8` | Avorio carta (tipo A) |
| Lastra GKF ignifuga | `#F4D3CF` | Rosa salmone (carta vera Knauf Fireboard) |
| Lastra GKI idro | `#CEE3F0` | Azzurro acqua |
| Lastra Habito alta densità | `#E5D9C8` | Avorio scuro |
| Lastra Aquaroc cementizia | `#C9C2B6` | Beige cemento |
| Glasroc X velo vetro | `#D8E8DA` | Verde tenue |
| Lastra forata acustica | `#F5F1E8` con pattern fori | Avorio + cerchi |
| Lana di roccia | `#FFE08A` | Giallo lana caldo |
| Lana di vetro | `#FFF3B8` | Giallo paglia chiaro |
| EPS / XPS | `#F0F0F0` con bordo | Bianco neutro |
| PIR / PUR | `#FFD6A5` | Arancio chiaro |
| Profilo metallico C/U | `#9CA3AF` | Grigio acciaio |
| Vite (puntino) | `#1F2937` | Nero pieno 1.5mm Ø |
| Aria / vuoto | `#FFFFFF` | Bianco con bordo `#D1D5DB` |
| Membrana freno vapore | `#7C3AED` | Viola, linea sottile 0.5mm |

### Color palette UI (Tailwind)

- Primary: `#0F766E` (teal-700) — coerente con costruzione/edilizia
- Success: `green-600`
- Warning: `amber-500`
- Error: `red-600`
- Muted text: `zinc-500`
- Border: `zinc-200`
- Background: `zinc-50`

### Pattern SVG nativi

```svg
<!-- Lana di roccia: matassa sinusoidale -->
<pattern id="pat-lana-roccia" patternUnits="userSpaceOnUse" width="6" height="6">
  <rect width="6" height="6" fill="#FFE08A"/>
  <path d="M0,3 Q1.5,0 3,3 T6,3" stroke="#B89200" fill="none" stroke-width="0.6"/>
</pattern>

<!-- Lana di vetro: tratteggio incrociato leggero -->
<pattern id="pat-lana-vetro" patternUnits="userSpaceOnUse" width="4" height="4">
  <rect width="4" height="4" fill="#FFF3B8"/>
  <path d="M0,2 L4,2 M2,0 L2,4" stroke="#D4A700" fill="none" stroke-width="0.3"/>
</pattern>

<!-- EPS: puntinato denso -->
<pattern id="pat-eps" patternUnits="userSpaceOnUse" width="3" height="3">
  <rect width="3" height="3" fill="#F0F0F0"/>
  <circle cx="1.5" cy="1.5" r="0.4" fill="#9CA3AF"/>
</pattern>

<!-- Lastra forata acustica: pattern Rigitone-style -->
<pattern id="pat-forata" patternUnits="userSpaceOnUse" width="6" height="6">
  <rect width="6" height="6" fill="#F5F1E8"/>
  <circle cx="3" cy="3" r="1" fill="#9CA3AF"/>
</pattern>
```

### Iconografia

Lucide React per le icone categoria:
- Lastra: `Square` (riempito con colore palette)
- Montante: `RectangleVertical`
- Guida: `RectangleHorizontal`
- Isolante: `Layers`
- Vite: `Wrench` (o icona ad hoc viti)
- Accessorio: `Package`
- Finitura: `Brush`

---

## 15. Tipografia, spaziature, breakpoint

### Tipografia

- **Font sistema**: Inter (già nel progetto via shadcn/Tailwind), system-ui fallback
- **Scala**:
  - h1 (nome stratigrafia): 24pt bold
  - h2 (zone "Lato A"): 14pt semibold uppercase tracking-wider
  - h3 (titoli card): 14pt medium
  - body: 13pt regular
  - sm: 11pt regular
  - xs (metadata): 10pt regular muted
- **SVG text**: sans-serif 9-10pt nelle quote, 10-12pt nelle etichette materiali

### Spaziature (Tailwind scale)

- Card layer gap: `space-y-3` (12px)
- Sezione gap: `space-y-6` (24px)
- Inset card: `p-3` (12px)
- Header app spacing: `gap-4` (16px)

### Breakpoint

- mobile: `<768px`
- tablet: `768px – 1279px`
- desktop: `≥1280px`
- desktop-xl: `≥1536px` (preview SVG ha più respiro)

---

## 16. Stati: empty, loading, error, validation

### Empty state — nuova stratigrafia

```
┌──────────────────────────────────────────────────────┐
│ [HEADER vuoto con placeholder "Es. Parete divisoria"]│
├──────────────────────────────────────────────────────┤
│              👇  Inizia da qui  👇                    │
│                                                       │
│  ╔════════════════════════════════════════════════╗  │
│  ║  📦  Parti da un sistema certificato          ║  │
│  ║      W111, W112, controsoffitto D11, ...      ║  │
│  ║      [Scegli ▸]                                ║  │
│  ╚════════════════════════════════════════════════╝  │
│                                                       │
│  ╔════════════════════════════════════════════════╗  │
│  ║  ✏️  Configura da zero                         ║  │
│  ║      Aggiungi i layer uno alla volta            ║  │
│  ║      [Aggiungi primo layer ▸]                   ║  │
│  ╚════════════════════════════════════════════════╝  │
│                                                       │
│  ╔════════════════════════════════════════════════╗  │
│  ║  📋  Duplica una stratigrafia esistente        ║  │
│  ║      Da preventivi precedenti                   ║  │
│  ║      [Sfoglia ▸]                                ║  │
│  ╚════════════════════════════════════════════════╝  │
└──────────────────────────────────────────────────────┘
```

### Loading

- Apertura preventivo esistente: skeleton dei card layer (placeholder grigio animato shimmer).
- Salvataggio: spinner nel button + body bloccato (opacity 0.7).
- Calcolo costi live: niente loading visibile (deve essere istantaneo, <100ms).

### Errori

- **Errore di rete** (salvataggio fallito): toast rosso in alto a destra "❌ Salvataggio fallito. [Riprova]".
- **Errore validazione** (nome vuoto, layer incompleto): inline rosso sotto il campo.
- **Errore catastrofico** (DB non risponde): banner rosso fisso in cima, "Connessione DB persa, ultime modifiche salvate localmente".

### Validation

| Errore | Indicatore |
|---|---|
| Nome stratigrafia vuoto | Bordo rosso input + messaggio sotto + button Salva disabled |
| Layer senza materiale | Card layer bordo rosso + badge "⚠ Materiale mancante" |
| Layer thickness=0 | Input rosso + messaggio "Spessore minimo 1mm" |
| Vite incompatibile con lastra | Badge giallo "⚠ Vite non ottimale per questa lastra" (warning, non blocca) |

---

## 17. Animazioni e micro-interazioni

> **Filosofia**: animazioni breve durata (150–250ms), `ease-out`, mai `ease-in-out` per elementi UI veloci. Niente animazioni "decorative" che rallentino.

### Drag & drop

- Layer dragged: `scale 1.02 + shadow-lg` durante drag.
- Drop zone target: bordo tratteggiato animato (dash-offset rotation, 1s loop).
- After drop: il layer "settles" con bounce leggero (spring 200ms).

### Aggiungi/rimuovi layer

- Aggiungi: layer compare con `slide-in from-bottom` + `fade-in` 200ms.
- Rimuovi: `slide-out to-right` + `fade-out` 200ms, poi gli altri si spostano in alto con transition 200ms.

### Cambio materiale

- Card cambia colore di sfondo background (transition `bg 150ms`).
- SVG layer corrispondente: cross-fade del fill color (200ms).

### Cambio spessore

- Input numerico ha `transition` su valore.
- SVG: il rettangolo del layer si ridimensiona con `transition: width 150ms ease-out`. Quote si spostano fluide.

### Tab switch (preview)

- Cross-fade tra tab Sezione → Pianta → Costi → Tecnico, 200ms.

### Hover material in combobox

- Mini-rettangolo a destra: scale 1.1 + ombra leggera, 100ms.

### Save success

- Pulsante diventa verde con tick ✓ per 2s, poi torna primary. No toast (non serve, l'animazione del button è sufficiente).

---

## 18. Codice sistema auto-generato

### Pattern

```
DC-{TIPO}{N}-{N_LASTRE_LATO_A}L+{N_LASTRE_LATO_B}L-{SEZIONE_MONT}-RW{Rw}-EI{EI}
```

Componenti:

- **`DC-`**: prefisso DryConfig
- **`TIPO`**: `W` (parete), `D` (controsoffitto/Decke), `LIN` (controparete/lining)
- **`N`**: numero progressivo Knauf-style: `11x` (singola orditura) / `12x` (doppia)
- **`N_LASTRE`**: `1L` `2L` `3L`
- **`SEZIONE_MONT`**: `50` `75` `100` `125` `150`
- **`Rw`**: solo se calcolato/certificato
- **`EI`**: solo se calcolato/certificato

### Esempi

| Stratigrafia | Codice |
|---|---|
| Parete 1+1 lastra 12.5, montante 75, lana | `DC-W111-1L+1L-75-RW45` |
| Parete 2+2 lastre 12.5, montante 75, lana, certif. EI60 | `DC-W112-2L+2L-75-RW54-EI60` |
| Controparete 1 lastra, montante 50 | `DC-LIN111-1L-50` |
| Controsoffitto 1 lastra, orditura 27/48 | `DC-D111-1L-48-RW28` |
| Stratigrafia "fuori standard" senza match | `DC-CUSTOM-{nome-slug}` |

### Visualizzazione

Il codice è **sempre visibile sotto al nome** nel header e nel pannello tecnico. Click per copiare negli appunti. Tooltip "Codice generato automaticamente · Click per copiare".

L'utente **non lo modifica direttamente** ma può modificarlo indirettamente (cambia composizione → codice si aggiorna). Il **nome** è invece libero.

---

## 19. Quick-add da template

Dialog accessibile via "Aggiungi sistema certificato".

### Layout

```
╔═══════════════════════════════════════════════════╗
║ Scegli sistema da template                  [×]  ║
╚═══════════════════════════════════════════════════╝

Filtra per [Pareti] [Controsoffitti] [Contropareti]

[🔍 Cerca per codice (W112, D112, ...) o prestazione (EI60, Rw54)]

┌─────────────────────────────────────────────────────┐
│  W111  Parete singola orditura  1+1 lastre         │
│        Spessore 100 mm · Rw 45 dB · ~€18/m²         │
│        [Anteprima ▸] [Inserisci ▸]                  │
├─────────────────────────────────────────────────────┤
│  W112  Parete singola orditura  2+2 lastre         │
│        Spessore 125 mm · Rw 54 dB · EI 60'          │
│        [Anteprima ▸] [Inserisci ▸]                  │
├─────────────────────────────────────────────────────┤
│  W115  Parete doppia orditura  2+2 lastre          │
│        Spessore 200 mm · Rw 60 dB · EI 90'          │
│        [Anteprima ▸] [Inserisci ▸]                  │
├─────────────────────────────────────────────────────┤
│  D112  Controsoffitto orditura singola              │
│        Spessore 100 mm · Rw 28 dB                   │
│        ...                                          │
└─────────────────────────────────────────────────────┘
```

I template sono **definiti nel codice come oggetti TS** (non in DB inizialmente, perché sono sistemi standard universali). Esempio:

```ts
const TEMPLATE_W112 = {
  code: 'W112',
  name: 'Parete singola orditura 2+2 lastre',
  type: 'partition',
  layers: [
    { category: 'board', material_type: 'gesso_rivestito', thickness: 12.5 },
    { category: 'board', material_type: 'gesso_rivestito', thickness: 12.5 },
    { category: 'structure_frame', profile_width_mm: 75, sheet_thickness: 0.6 },
    { category: 'insulation', material_type: 'lana_roccia', thickness: 60 },
    { category: 'board', material_type: 'gesso_rivestito', thickness: 12.5 },
    { category: 'board', material_type: 'gesso_rivestito', thickness: 12.5 },
  ],
  performance: { Rw: 54, EI: 60, lambda: 0.040 },
};
```

Quando l'utente clicca "Inserisci", il configuratore:
1. Risolve i `material_type` astratti scegliendo il primo materiale del catalogo che corrisponde (filtrando per fornitore se attivo).
2. Crea i layer con i thickness del template.
3. Auto-genera codice e suggerisce vite.
4. Mostra toast "Sistema W112 inserito. Personalizza i materiali se necessario.".

---

## 20. Esportazione PDF stile catalogo

Click su menu kebab → "Esporta PDF".

### Layout PDF (A4 verticale)

**Pagina 1 — Scheda tecnica**

```
┌──────────────────────────────────────────────────┐
│ [LOGO DryConfig]              Scheda Stratigrafia │
│                                                   │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                   │
│ Parete divisoria Cucchi          DC-W112-RW54     │
│ Stratigrafia personalizzata                       │
│                                                   │
│ ┌────────────────┐ ┌─────────────────────────┐   │
│ │                │ │ PRESTAZIONI              │   │
│ │ Preview SVG    │ │ EI    60'                │   │
│ │ sezione        │ │ Rw    54 dB              │   │
│ │ orizzontale    │ │ λ     0.040 W/mK         │   │
│ │ 1:5            │ │ Peso  25 kg/m²           │   │
│ │                │ │                          │   │
│ │                │ │ COSTRUTTIVE              │   │
│ │                │ │ Spessore  125 mm         │   │
│ │                │ │ Tipologia GKB tipo A     │   │
│ │                │ │ Orditura  Mont. 75       │   │
│ └────────────────┘ │ Isolante  Lana 60 mm     │   │
│                    └─────────────────────────┘   │
│                                                   │
│ COMPOSIZIONE                                      │
│ ┌──────┬──────────────────────┬────────┬───────┐  │
│ │ Pos. │ Materiale            │ Spess. │ €/m²  │  │
│ ├──────┼──────────────────────┼────────┼───────┤  │
│ │ 1    │ Gyproc Wallboard 13  │ 12.5   │ 1,96  │  │
│ │ 2    │ Gyproc Wallboard 13  │ 12.5   │ 1,96  │  │
│ │ 3    │ Montante 75 0.6      │ 75     │ 2,38  │  │
│ │ 4    │ Isover lana roccia   │ 60     │ 4,12  │  │
│ │ 5    │ Gyproc Wallboard 13  │ 12.5   │ 1,96  │  │
│ │ 6    │ Gyproc Wallboard 13  │ 12.5   │ 1,96  │  │
│ ├──────┼──────────────────────┼────────┼───────┤  │
│ │      │ TOTALE               │ 125    │ 23,50 │  │
│ └──────┴──────────────────────┴────────┴───────┘  │
└──────────────────────────────────────────────────┘
```

**Pagina 2 (opzionale)** — Note di posa, certificazioni, log modifiche.

Stack tecnico: `jsPDF + jspdf-autotable v5` (già nel progetto).

---

## 21. Accessibilità

- Tutti i controlli interattivi: `aria-label` esplicito.
- Drag & drop con `dnd-kit`: include `KeyboardSensor` (frecce per riordinare con tastiera).
- Combobox: `role="combobox"`, `aria-expanded`, `aria-controls`.
- Contrasto colori: AA (4.5:1) per testo, AAA (7:1) per CTA principali.
- Keyboard nav: `Tab` muove tra zone. `Esc` chiude modal/popover. `Ctrl+S` salva. `Ctrl+Z` undo.
- Screen reader: ogni layer ha `aria-label` discorsivo "Layer 1 di 4: Lastra Wallboard 13 di Saint Gobain, spessore 12.5 mm".
- Focus visible: outline `2px primary-500` su tutti gli elementi interattivi.

---

## 22. Mappatura componenti React previsti

```
src/pages/ConfiguratorV2.tsx                          (nuovo, parallelo)
src/components/configurator-v2/
├── ConfiguratorV2Layout.tsx                          (split desktop / tab mobile)
├── header/
│   ├── ConfiguratorHeader.tsx                        (nome, codice, salva, kebab)
│   ├── SystemCodeBadge.tsx                           (DC-W112-... copy on click)
│   └── SupplierFilterDropdown.tsx
├── composition/
│   ├── LayersPanel.tsx                               (lista + dnd-kit context)
│   ├── ZoneDivider.tsx                               (Lato A / Struttura / Lato B)
│   ├── LayerCard.tsx                                 (card singola, drag handle)
│   ├── LayerCardScrewSection.tsx                     (accordion vite associata)
│   ├── ThicknessInput.tsx                            (input + dropdown snap)
│   ├── AddLayerButton.tsx
│   └── NotesAccordion.tsx
├── material-picker/
│   ├── MaterialPickerDialog.tsx                      (cmdk modal)
│   ├── MaterialPickerFilters.tsx                     (faceted laterali)
│   └── MaterialPickerRow.tsx                         (riga singola con prezzo)
├── visualization/
│   ├── VisualizationPanel.tsx                        (tab + sticky)
│   ├── VisualizationTabs.tsx                         (Sezione/Pianta/Costi/Tecnico)
│   ├── section-view/
│   │   ├── SectionViewSVG.tsx                        (preview principale)
│   │   ├── SVGPatternsDefs.tsx                       (defs pattern lana, EPS, etc.)
│   │   ├── BoardLayerSVG.tsx
│   │   ├── StructureProfileSVG.tsx                   (forma C reale)
│   │   ├── InsulationLayerSVG.tsx
│   │   ├── ScrewDistributionSVG.tsx                  (puntini viti)
│   │   ├── DimensionLineSVG.tsx                      (quote dimensionali)
│   │   └── ZoomControls.tsx
│   ├── plan-view/
│   │   ├── PlanViewSVG.tsx                           (vista pianta)
│   │   └── InteraxisSlider.tsx
│   ├── PerformanceBox.tsx                            (EI/Rw/λ/peso)
│   ├── CostBreakdownPanel.tsx                        (tab Costi)
│   └── TechnicalSummary.tsx                          (tab Tecnico)
├── empty-states/
│   ├── EmptyConfigurator.tsx                         (3 cards: template/zero/duplica)
│   └── TemplatePickerDialog.tsx                      (W111/W112/...)
├── hooks/
│   ├── useConfiguratorState.ts                       (state machine globale)
│   ├── useLayersDnd.ts                               (sortable + zone logic)
│   ├── useSystemCode.ts                              (calcolo codice DC-...)
│   ├── usePerformanceCalc.ts                         (EI/Rw/λ live)
│   └── useMaterialPicker.ts                          (cmdk + facets state)
└── templates/
    ├── walls.ts                                      (W111, W112, W115, W118)
    ├── ceilings.ts                                   (D111, D112)
    └── lining.ts                                     (LIN111)
```

---

## Cosa NON è in questo documento (consapevolmente)

- **3D isometric**: rimandato a dopo MVP. Three.js è overkill ora.
- **Confronto side-by-side stratigrafie**: feature di fase 4.
- **Storico versioni di una stratigrafia**: feature di fase 4.
- **Editor grafico drag-from-canvas**: troppo complesso, e i cataloghi pro non lo fanno (drag dal form).
- **Annotazioni/markup sul preview**: feature post-MVP.

## Glossario rapido

- **GKB**: Gypsum Karton Building — lastra cartongesso standard EN 520 tipo A
- **GKF**: Gypsum Karton Fire — lastra ignifuga (DF)
- **GKI**: Gypsum Karton Imprägniert — lastra idrofuga (H1/H2)
- **EI**: Resistenza al fuoco (in minuti) secondo EN 13501-2
- **Rw**: Indice di valutazione del potere fonoisolante (dB) secondo EN ISO 717-1
- **λ**: Conducibilità termica (W/mK)
- **ρ**: Densità (kg/m³)
- **W11x**: nomenclatura Knauf parete singola orditura (W112 = 2+2 lastre)
- **D11x**: nomenclatura Knauf controsoffitto
- **DIN**: Deutsche Industrie-Norm — profili standard tedeschi (largamente usati in IT)
- **UNI 11424:2015**: norma italiana posa cartongesso
- **EN 520**: norma europea lastre in gesso rivestito

import React, { useMemo } from 'react';
import SVGPatternsDefs from './SVGPatternsDefs';
import { buildWallSectionModel, generateWallTitle, type WallBlock, type BoardBlock, type StructureBlock, type OrphanInsulationBlock } from './wallModel';
import { typologyLabel, useTypologyDetection } from '../../hooks/useTypologyDetection';
import type { LayerV2 } from '../../types';

interface TechnicalWallDrawingProps {
  layers: LayerV2[];
  /** Codice sistema generato (DC-W112-...). */
  systemCode?: string;
  /** Altezza ideale di parete in mm (per scala). Default 2700. */
  wallHeightMm?: number;
  /** Interasse montanti in mm (default 600). */
  studSpacingMm?: number;
}

/**
 * Tavola tecnica architettonica della parete a secco.
 *
 * Layout 16:9 (1280×720 viewBox), stile catalogo Knauf:
 *  - Header centrale con titolo dinamico + codice sistema
 *  - Centro: rappresentazione della parete in sezione VERTICALE (alta) + in
 *    sezione orizzontale (sopra), con solaio sopra/pavimento sotto
 *  - Sinistra: quote dimensionali e spessore totale
 *  - Destra: legenda numerata (callout) + box composizione + box prestazioni
 *  - Basso: dettagli tecnici di posa e info supplementari
 *
 * Stile: bianco pulito, linee 0.5-0.8 px, testi 9-11 pt sans, ombre leggere.
 */
const TechnicalWallDrawing: React.FC<TechnicalWallDrawingProps> = ({
  layers,
  systemCode,
  wallHeightMm = 2700,
  studSpacingMm = 600,
}) => {
  const typology = useTypologyDetection(layers);
  const model = useMemo(() => buildWallSectionModel(layers), [layers]);
  const title = useMemo(() => generateWallTitle(model, typology), [model, typology]);

  // Se vuoto: empty state minimal
  if (model.blocks.length === 0) {
    return (
      <div className="aspect-video bg-white border rounded-lg flex items-center justify-center text-muted-foreground p-12">
        <div className="text-center">
          <div className="text-sm font-medium">Aggiungi i primi layer</div>
          <div className="text-xs mt-1">La tavola tecnica si genera automaticamente.</div>
        </div>
      </div>
    );
  }

  // ========= LAYOUT (viewBox 1280×720, ratio 16:9) =========
  const VB_W = 1280;
  const VB_H = 720;

  // Aree
  const HEADER_H = 64;
  const FOOTER_H = 60;
  const LEFT_PAD = 40;
  const SIDEBAR_W = 320;
  const RIGHT_PAD = 24;
  const DRAW_X = LEFT_PAD;
  const DRAW_Y = HEADER_H + 30;
  const DRAW_W = VB_W - LEFT_PAD - SIDEBAR_W - RIGHT_PAD;
  const DRAW_H = VB_H - HEADER_H - FOOTER_H - 60;

  // SCALA spessore parete: cerchiamo di occupare ~80% di DRAW_H per la sezione verticale
  // ma manteniamo proporzioni reali tra spessori dei singoli blocchi.
  // Vista: parete in piedi → asse Y = altezza parete (2700mm), asse X = spessore parete (es. 125mm).
  // Poiché lo spessore è molto piccolo rispetto all'altezza, usiamo due scale diverse:
  //   - scaleY = DRAW_H * 0.85 / wallHeightMm (per altezza)
  //   - scaleX = computed per riempire ~70% di DRAW_W con lo spessore totale
  const scaleY = (DRAW_H * 0.85) / Math.max(wallHeightMm, 100);
  const idealWallWidthPx = DRAW_W * 0.50;
  const totalThickness = Math.max(model.totalThicknessMm, 25);
  const scaleX = idealWallWidthPx / totalThickness;

  const wallTotalPx = totalThickness * scaleX;
  const wallHeightPx = wallHeightMm * scaleY;
  const wallCenterX = DRAW_X + DRAW_W / 2;
  const wallStartX = wallCenterX - wallTotalPx / 2;
  const wallStartY = DRAW_Y + (DRAW_H - wallHeightPx) * 0.5;
  const wallEndY = wallStartY + wallHeightPx;

  // Calcolo posizione X cumulata di ogni blocco + ordinale per le strutture
  // (per badge "Orditura 1 / 2" in caso di doppia orditura).
  type DrawBlock = {
    block: WallBlock;
    x: number;
    w: number;
    calloutNum: number;
    structureOrdinal: number; // 0 se non struttura, altrimenti 1, 2, ...
  };
  const drawBlocks: DrawBlock[] = [];
  let cursorX = wallStartX;
  let calloutCounter = 1;
  let structSeen = 0;
  for (const b of model.blocks) {
    const w = (b.kind === 'board' ? b.thicknessMm : b.depthMm) * scaleX;
    const structureOrdinal = b.kind === 'structure' ? ++structSeen : 0;
    drawBlocks.push({ block: b, x: cursorX, w, calloutNum: calloutCounter, structureOrdinal });
    calloutCounter += 1;
    cursorX += w;
  }
  const totalStructures = structSeen;

  // Numero di montanti visibili nella vista frontale (almeno 3 per dare senso)
  const studsCount = Math.max(3, Math.ceil(2400 / studSpacingMm));

  // Solaio + pavimento (sopra/sotto la parete)
  const SLAB_H = 28;
  const slabTop = wallStartY - SLAB_H;
  const slabBottom = wallEndY;

  return (
    <div className="bg-white border rounded-lg overflow-hidden shadow-sm" data-section-view="true">
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="w-full h-auto technical-wall-svg"
        xmlns="http://www.w3.org/2000/svg"
      >
        <SVGPatternsDefs />

        {/* === BACKGROUND === */}
        <rect x={0} y={0} width={VB_W} height={VB_H} fill="#ffffff" />

        {/* === HEADER (titolo dinamico) === */}
        <g>
          <text
            x={LEFT_PAD}
            y={32}
            fontSize={20}
            fontWeight={700}
            fill="#0F172A"
            fontFamily="Inter, system-ui, sans-serif"
          >
            {title}
          </text>
          {systemCode && (
            <text
              x={LEFT_PAD}
              y={52}
              fontSize={11}
              fill="#64748B"
              fontFamily="ui-monospace, monospace"
              letterSpacing="0.05em"
            >
              {systemCode}
            </text>
          )}
          <text
            x={LEFT_PAD}
            y={66}
            fontSize={9}
            fill="#94A3B8"
            fontFamily="Inter, system-ui, sans-serif"
            textTransform="uppercase"
            letterSpacing="0.1em"
          >
            {typologyLabel(typology)} · scala 1:5 (indicativa)
          </text>

          {/* Linea sotto header */}
          <line x1={LEFT_PAD} y1={HEADER_H + 16} x2={VB_W - SIDEBAR_W - 16} y2={HEADER_H + 16} stroke="#E2E8F0" strokeWidth={0.5} />
        </g>

        {/* === SOLAIO E PAVIMENTO === */}
        <g>
          {/* Solaio */}
          <rect
            x={wallStartX - 30}
            y={slabTop}
            width={wallTotalPx + 60}
            height={SLAB_H}
            fill="url(#pat-concrete)"
            stroke="#71717A"
            strokeWidth={0.6}
          />
          <text
            x={wallStartX - 28}
            y={slabTop + 18}
            fontSize={9}
            fill="#52525B"
            fontFamily="Inter, system-ui, sans-serif"
          >
            SOLAIO
          </text>
          {/* Pavimento */}
          <rect
            x={wallStartX - 30}
            y={slabBottom}
            width={wallTotalPx + 60}
            height={SLAB_H}
            fill="url(#pat-concrete)"
            stroke="#71717A"
            strokeWidth={0.6}
          />
          <text
            x={wallStartX - 28}
            y={slabBottom + 18}
            fontSize={9}
            fill="#52525B"
            fontFamily="Inter, system-ui, sans-serif"
          >
            PAVIMENTO
          </text>
        </g>

        {/* === DISEGNO PARETE (sezione verticale) === */}
        <g filter="url(#soft-shadow)">
          {drawBlocks.map(({ block, x, w, structureOrdinal }, idx) => {
            if (block.kind === 'board') {
              return (
                <BoardRect
                  key={idx}
                  block={block}
                  x={x}
                  y={wallStartY}
                  w={w}
                  h={wallHeightPx}
                />
              );
            }
            if (block.kind === 'structure') {
              return (
                <StructureGroup
                  key={idx}
                  block={block}
                  x={x}
                  y={wallStartY}
                  w={w}
                  h={wallHeightPx}
                  studsCount={studsCount}
                  structureOrdinal={structureOrdinal}
                  showOrdinal={totalStructures > 1}
                />
              );
            }
            // orphan_insulation: render con bordo tratteggiato rosso (warning)
            return (
              <OrphanInsulationRect
                key={idx}
                block={block}
                x={x}
                y={wallStartY}
                w={w}
                h={wallHeightPx}
              />
            );
          })}
        </g>

        {/* === QUOTE SOPRA AL DISEGNO === */}
        <g>
          <DimensionLine
            x1={wallStartX}
            x2={wallStartX + wallTotalPx}
            y={wallStartY - SLAB_H - 18}
            label={`${totalThickness.toFixed(0)} mm`}
            color="#0F172A"
            strong
          />
          {/* Quote singoli blocchi */}
          {drawBlocks.map(({ block, x, w }, idx) => {
            const thick = block.kind === 'board' ? block.thicknessMm : block.depthMm;
            return (
              <DimensionLine
                key={idx}
                x1={x}
                x2={x + w}
                y={wallStartY - SLAB_H - 36}
                label={`${thick}`}
                fontSize={8}
              />
            );
          })}
        </g>

        {/* === CALLOUT NUMERATI === */}
        <g>
          {drawBlocks.map(({ block, x, w, calloutNum }) => {
            const cx = x + w / 2;
            const targetY = wallStartY + 22;
            return (
              <Callout
                key={calloutNum}
                num={calloutNum}
                x={cx}
                y={targetY}
              />
            );
          })}
        </g>

        {/* === SIDEBAR DESTRA: legenda + composizione + prestazioni === */}
        <RightSidebar
          x={VB_W - SIDEBAR_W - RIGHT_PAD}
          y={HEADER_H}
          w={SIDEBAR_W}
          h={VB_H - HEADER_H - FOOTER_H}
          drawBlocks={drawBlocks}
          totalThicknessMm={totalThickness}
          studSpacingMm={studSpacingMm}
          wallHeightMm={wallHeightMm}
        />

        {/* === FOOTER (info posa) === */}
        <g>
          <line x1={LEFT_PAD} y1={VB_H - FOOTER_H} x2={VB_W - RIGHT_PAD} y2={VB_H - FOOTER_H} stroke="#E2E8F0" strokeWidth={0.5} />
          <text
            x={LEFT_PAD}
            y={VB_H - FOOTER_H + 18}
            fontSize={9}
            fill="#64748B"
            fontFamily="Inter, system-ui, sans-serif"
          >
            Posa secondo UNI 11424:2015 · Penetrazione viti ≥ 10 mm · Interasse viti 250 mm in campo, 200 mm sui bordi
          </text>
          <text
            x={LEFT_PAD}
            y={VB_H - FOOTER_H + 34}
            fontSize={9}
            fill="#94A3B8"
            fontFamily="Inter, system-ui, sans-serif"
          >
            Disegno generato automaticamente · DryConfig · scala approssimativa, non sostituisce esecutivo
          </text>
        </g>
      </svg>
    </div>
  );
};

// ============================================================================
// SUB-COMPONENTI
// ============================================================================

export const BoardRect: React.FC<{
  block: BoardBlock;
  x: number; y: number; w: number; h: number;
}> = ({ block, x, y, w, h }) => {
  const isPattern = block.fillId.startsWith('pat-');
  const fill = isPattern ? `url(#${block.fillId})` : `url(#${block.fillId})`;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        fill={fill}
        stroke="#1F2937"
        strokeWidth={0.6}
      />
      {/* Testo verticale del nome lastra (se larghezza sufficiente) */}
      {w > 25 && (
        <text
          x={x + w / 2}
          y={y + h / 2}
          fontSize={9}
          fill="#475569"
          fontFamily="Inter, system-ui, sans-serif"
          textAnchor="middle"
          transform={`rotate(-90, ${x + w / 2}, ${y + h / 2})`}
          opacity={0.7}
        >
          {block.label.slice(0, 18)}
        </text>
      )}
    </g>
  );
};

/**
 * Gruppo struttura: montanti C verticali ripetuti ogni interasse, isolante riempi.
 * Disegniamo la sezione VERTICALE: vediamo i montanti come rettangoli metallici
 * verticali distanziati, l'isolante come pattern lana che riempie i vani.
 */
export const StructureGroup: React.FC<{
  block: StructureBlock;
  x: number; y: number; w: number; h: number;
  studsCount: number;
  structureOrdinal?: number;
  showOrdinal?: boolean;
}> = ({ block, x, y, w, h, studsCount, structureOrdinal, showOrdinal }) => {
  // Sfondo isolante (riempie tutto)
  const insulationFill = block.insulationFillId ? `url(#${block.insulationFillId})` : '#F4F4F5';

  // Stud profile come "C": disegniamo un rettangolo verticale stretto come "anima" del montante
  // visto in sezione (altezza variabile vs vista). Per la sezione verticale di una parete,
  // i montanti SONO IN PIEDI: si vedono come rettangoli verticali sottili (la lamiera).
  const studWidthPx = Math.min(w * 0.85, 8);
  const studXOffset = (w - studWidthPx) / 2;

  // Numero montanti visibili nella vista (3 fittizi)
  const studPositions: number[] = [];
  for (let i = 0; i < studsCount; i++) {
    studPositions.push(y + 30 + (i * (h - 60)) / Math.max(1, studsCount - 1));
  }

  // Per il rendering "esterno" mostriamo l'intera area piena di isolante + montanti verticali
  // sovrimposti come piccoli rettangoli (sezione anima) NON in posizione realistica perché
  // la sezione verticale taglia la parete, non guarda la sua lunghezza. Ma per dare un
  // visivo identificabile mostriamo i montanti come 2-3 evidenziatori stilizzati.

  // Stroke più marcata se è una doppia orditura (per leggere a colpo d'occhio i 2 telai)
  const outerStroke = showOrdinal ? 1.0 : 0.6;
  const outerStrokeColor = showOrdinal ? '#0F172A' : '#1F2937';

  return (
    <g>
      {/* Sfondo: isolante o vuoto */}
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        fill={insulationFill}
        stroke={outerStrokeColor}
        strokeWidth={outerStroke}
      />

      {/* Badge "Orditura N" (solo in caso di doppia orditura) */}
      {showOrdinal && structureOrdinal && structureOrdinal > 0 && w > 24 && (
        <g>
          <rect
            x={x + 4}
            y={y + 4}
            width={Math.min(w - 8, 64)}
            height={16}
            rx={3}
            fill="#0F172A"
            opacity={0.85}
          />
          <text
            x={x + 4 + Math.min(w - 8, 64) / 2}
            y={y + 15}
            fontSize={9}
            fill="#FFFFFF"
            fontFamily="Inter, system-ui, sans-serif"
            textAnchor="middle"
            fontWeight={700}
            letterSpacing="0.04em"
          >
            ORDITURA {structureOrdinal}
          </text>
        </g>
      )}

      {/* Profilo C anima del montante (disegnato come "U" rotata verticale) */}
      <g>
        {/* Anima verticale (la "spina dorsale" del montante visto di taglio) */}
        <rect
          x={x + studXOffset}
          y={y + 10}
          width={studWidthPx}
          height={h - 20}
          fill="url(#grad-metal)"
          stroke="#3F4756"
          strokeWidth={0.5}
        />
        {/* Ali superiori (il "C" si chiude in alto) */}
        <rect x={x + 2} y={y + 8} width={w - 4} height={3} fill="url(#grad-metal)" stroke="#3F4756" strokeWidth={0.4} />
        {/* Ali inferiori */}
        <rect x={x + 2} y={y + h - 11} width={w - 4} height={3} fill="url(#grad-metal)" stroke="#3F4756" strokeWidth={0.4} />
      </g>

      {/* Etichetta verticale */}
      {w > 30 && (
        <text
          x={x + w / 2}
          y={y + h / 2}
          fontSize={9}
          fill="#1F2937"
          fontFamily="Inter, system-ui, sans-serif"
          textAnchor="middle"
          transform={`rotate(-90, ${x + w / 2}, ${y + h / 2})`}
          opacity={0.85}
          fontWeight={600}
        >
          {block.studLabel?.slice(0, 24) ?? 'Struttura'}
        </text>
      )}
    </g>
  );
};

/**
 * Isolante orfano: pattern lana + bordo tratteggiato rosso + icona warning.
 * Comunica visivamente "questo è fuori posto, l'isolante va dentro la struttura".
 */
export const OrphanInsulationRect: React.FC<{
  block: OrphanInsulationBlock;
  x: number; y: number; w: number; h: number;
}> = ({ block, x, y, w, h }) => {
  const fill = `url(#${block.fillId})`;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        fill={fill}
        stroke="#DC2626"
        strokeWidth={1.2}
        strokeDasharray="6 4"
      />
      {/* Banda warning in alto */}
      <rect
        x={x}
        y={y}
        width={w}
        height={20}
        fill="#FEE2E2"
        opacity={0.85}
      />
      <text
        x={x + w / 2}
        y={y + 13}
        fontSize={9}
        fill="#991B1B"
        fontFamily="Inter, system-ui, sans-serif"
        textAnchor="middle"
        fontWeight={700}
      >
        ⚠ FUORI VANO
      </text>
      {w > 25 && (
        <text
          x={x + w / 2}
          y={y + h / 2}
          fontSize={9}
          fill="#7F1D1D"
          fontFamily="Inter, system-ui, sans-serif"
          textAnchor="middle"
          transform={`rotate(-90, ${x + w / 2}, ${y + h / 2})`}
          opacity={0.85}
        >
          {block.label.slice(0, 18)}
        </text>
      )}
    </g>
  );
};

/**
 * Linea di quotatura tecnica con frecce sottili e label.
 */
const DimensionLine: React.FC<{
  x1: number; x2: number; y: number;
  label: string;
  color?: string;
  fontSize?: number;
  strong?: boolean;
}> = ({ x1, x2, y, label, color = '#475569', fontSize = 10, strong = false }) => {
  const tickH = 4;
  return (
    <g>
      <line x1={x1} y1={y} x2={x2} y2={y} stroke={color} strokeWidth={strong ? 0.8 : 0.5} />
      <line x1={x1} y1={y - tickH} x2={x1} y2={y + tickH} stroke={color} strokeWidth={strong ? 0.8 : 0.5} />
      <line x1={x2} y1={y - tickH} x2={x2} y2={y + tickH} stroke={color} strokeWidth={strong ? 0.8 : 0.5} />
      <rect
        x={(x1 + x2) / 2 - 22}
        y={y - 8}
        width={44}
        height={16}
        fill="#FFFFFF"
        opacity={0.95}
      />
      <text
        x={(x1 + x2) / 2}
        y={y + 4}
        fontSize={fontSize}
        fill={color}
        fontFamily="Inter, system-ui, sans-serif"
        textAnchor="middle"
        fontWeight={strong ? 700 : 500}
      >
        {label}
      </text>
    </g>
  );
};

/**
 * Cerchio numerato di callout, con linea che parte verso la sidebar.
 */
const Callout: React.FC<{ num: number; x: number; y: number }> = ({ num, x, y }) => (
  <g>
    <circle cx={x} cy={y} r={9} fill="#FFFFFF" stroke="#0F766E" strokeWidth={1} />
    <text
      x={x}
      y={y + 3}
      fontSize={10}
      fill="#0F766E"
      fontFamily="Inter, system-ui, sans-serif"
      textAnchor="middle"
      fontWeight={700}
    >
      {num}
    </text>
  </g>
);

/**
 * Sidebar destra: legenda numerata + composizione + prestazioni.
 */
const RightSidebar: React.FC<{
  x: number; y: number; w: number; h: number;
  drawBlocks: { block: WallBlock; x: number; w: number; calloutNum: number }[];
  totalThicknessMm: number;
  studSpacingMm: number;
  wallHeightMm: number;
}> = ({ x, y, w, h, drawBlocks, totalThicknessMm, studSpacingMm, wallHeightMm }) => {
  const PAD = 12;
  const innerW = w - PAD * 2;
  const lineH = 18;

  // Compongo la legenda (callout)
  const legendItems = drawBlocks.map(({ block, calloutNum }) => {
    if (block.kind === 'board') {
      const thick = block.thicknessMm;
      const supplier = block.layer.material?.supplier ?? '';
      return {
        num: calloutNum,
        title: block.label,
        sub: `${thick} mm · ${supplier}`,
        warning: false,
      };
    }
    if (block.kind === 'structure') {
      const studName = block.studLabel ?? 'Struttura';
      const insulName = block.insulationLabel;
      return {
        num: calloutNum,
        title: studName,
        sub: insulName ? `${block.depthMm} mm · isolante: ${insulName}` : `${block.depthMm} mm`,
        warning: false,
      };
    }
    // orphan_insulation
    return {
      num: calloutNum,
      title: `⚠ ${block.label}`,
      sub: `${block.depthMm} mm · isolante FUORI vano — sposta dentro la struttura`,
      warning: true,
    };
  });

  return (
    <g>
      {/* Background sidebar */}
      <rect x={x} y={y} width={w} height={h} fill="#F8FAFC" stroke="#E2E8F0" strokeWidth={0.5} />

      {/* === LEGENDA === */}
      <text
        x={x + PAD}
        y={y + 22}
        fontSize={11}
        fill="#0F172A"
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight={700}
        textTransform="uppercase"
        letterSpacing="0.05em"
      >
        Legenda
      </text>
      {legendItems.map((item, i) => {
        const ly = y + 38 + i * (lineH + 6);
        const stroke = item.warning ? '#DC2626' : '#0F766E';
        const titleFill = item.warning ? '#991B1B' : '#0F172A';
        const subFill = item.warning ? '#B91C1C' : '#64748B';
        return (
          <g key={item.num}>
            <circle cx={x + PAD + 9} cy={ly + 2} r={9} fill="#FFFFFF" stroke={stroke} strokeWidth={1} />
            <text
              x={x + PAD + 9}
              y={ly + 5}
              fontSize={10}
              fill={stroke}
              fontFamily="Inter, system-ui, sans-serif"
              textAnchor="middle"
              fontWeight={700}
            >
              {item.num}
            </text>
            <text
              x={x + PAD + 24}
              y={ly + 1}
              fontSize={11}
              fill={titleFill}
              fontFamily="Inter, system-ui, sans-serif"
              fontWeight={600}
            >
              {item.title.length > 32 ? item.title.slice(0, 30) + '…' : item.title}
            </text>
            <text
              x={x + PAD + 24}
              y={ly + 13}
              fontSize={9}
              fill={subFill}
              fontFamily="Inter, system-ui, sans-serif"
            >
              {item.sub}
            </text>
          </g>
        );
      })}

      {/* === COMPOSIZIONE TECNICA (in basso) === */}
      {(() => {
        const startY = y + 38 + legendItems.length * (lineH + 6) + 24;
        const rows: { label: string; value: string }[] = [
          { label: 'Spessore totale', value: `${totalThicknessMm.toFixed(0)} mm` },
          { label: 'Altezza parete', value: `${wallHeightMm} mm` },
          { label: 'Interasse mont.', value: `${studSpacingMm} mm` },
          { label: 'N° strati', value: String(legendItems.length) },
        ];
        return (
          <>
            <text
              x={x + PAD}
              y={startY}
              fontSize={11}
              fill="#0F172A"
              fontFamily="Inter, system-ui, sans-serif"
              fontWeight={700}
              textTransform="uppercase"
              letterSpacing="0.05em"
            >
              Composizione
            </text>
            {rows.map((r, i) => (
              <g key={r.label}>
                <text
                  x={x + PAD}
                  y={startY + 18 + i * 16}
                  fontSize={10}
                  fill="#64748B"
                  fontFamily="Inter, system-ui, sans-serif"
                >
                  {r.label}
                </text>
                <text
                  x={x + w - PAD}
                  y={startY + 18 + i * 16}
                  fontSize={10}
                  fill="#0F172A"
                  fontFamily="ui-monospace, monospace"
                  textAnchor="end"
                  fontWeight={600}
                >
                  {r.value}
                </text>
              </g>
            ))}
          </>
        );
      })()}
    </g>
  );
};

export default TechnicalWallDrawing;

import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Map } from 'lucide-react';
import SVGPatternsDefs from '../section-view/SVGPatternsDefs';
import { buildWallSectionModel, type WallBlock } from '../section-view/wallModel';
import type { LayerV2 } from '../../types';

interface PlanViewProps {
  layers: LayerV2[];
  studSpacingMm: 300 | 400 | 600;
  /** Lunghezza visibile della parete in pianta (mm). Default 2400. */
  wallLengthMm?: number;
}

/**
 * Tab Pianta: vista dall'alto della stratigrafia.
 *
 * X = lunghezza parete (con quote interasse montanti)
 * Y = spessore parete (Lato A in alto, Lato B in basso)
 *
 * Mostra:
 *  - Lastre come fasce orizzontali continue lungo X (Lato A + Lato B)
 *  - Struttura: montanti C in sezione orizzontale a interasse studSpacingMm
 *  - Lana minerale nei vani fra i montanti
 *  - Quote: spessore parete + interasse + lunghezza visualizzata
 *  - Etichette LATO A esterno / LATO B interno
 */
const PlanView: React.FC<PlanViewProps> = ({
  layers,
  studSpacingMm,
  wallLengthMm = 2400,
}) => {
  const model = useMemo(() => buildWallSectionModel(layers), [layers]);

  if (model.blocks.length === 0) {
    return (
      <Card className="p-12 text-center text-sm text-muted-foreground border-dashed min-h-[420px] flex items-center justify-center">
        <div>
          <Map className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
          <p>Aggiungi materiali per vedere la vista in pianta</p>
        </div>
      </Card>
    );
  }

  // ===== Layout SVG =====
  const VB_W = 1280;
  const VB_H = 720;
  const HEADER_H = 70;
  const FOOTER_H = 50;
  const PAD_LEFT = 80;
  const PAD_RIGHT = 80;
  const QUOTE_AREA_TOP = 60; // sopra la parete: quote interasse
  const QUOTE_AREA_BOTTOM = 40; // sotto la parete: quota lunghezza

  const drawAreaW = VB_W - PAD_LEFT - PAD_RIGHT;
  const drawAreaH = VB_H - HEADER_H - FOOTER_H - QUOTE_AREA_TOP - QUOTE_AREA_BOTTOM;

  const totalThickness = Math.max(model.totalThicknessMm, 25);

  // Scala: X copre 90% della larghezza utile, Y per spessore parete
  const scaleX = drawAreaW / wallLengthMm;
  const idealWallThicknessPx = drawAreaH * 0.55;
  const scaleY = idealWallThicknessPx / totalThickness;

  const wallW = wallLengthMm * scaleX;
  const wallH = totalThickness * scaleY;
  const wallX = PAD_LEFT;
  const wallY = HEADER_H + QUOTE_AREA_TOP + (drawAreaH - wallH) / 2;

  // ===== Calcolo posizioni Y dei blocchi (lungo lo spessore parete) =====
  type DrawnBlock = {
    block: WallBlock;
    yStart: number;
    yEnd: number;
    depthMm: number;
  };
  const drawnBlocks: DrawnBlock[] = [];
  let cursorY = 0;
  for (const b of model.blocks) {
    const depth = b.kind === 'board' ? b.thicknessMm : b.depthMm;
    drawnBlocks.push({ block: b, yStart: cursorY, yEnd: cursorY + depth, depthMm: depth });
    cursorY += depth;
  }

  // ===== Calcolo posizioni X dei montanti =====
  const studPositions: number[] = [];
  let xCursor = studSpacingMm * 0.4; // primo montante leggermente offset
  while (xCursor < wallLengthMm) {
    studPositions.push(xCursor);
    xCursor += studSpacingMm;
  }

  // Helpers
  const fillFor = (b: WallBlock): string => {
    if (b.kind === 'board') return `url(#${b.fillId})`;
    if (b.kind === 'orphan_insulation') return `url(#${b.fillId})`;
    if (b.kind === 'structure') return b.insulationFillId ? `url(#${b.insulationFillId})` : '#F4F4F5';
    return 'url(#grad-board-std)';
  };
  const labelOf = (b: WallBlock): string => {
    if (b.kind === 'board') return b.label;
    if (b.kind === 'structure') return b.studLabel ?? 'Struttura';
    return b.label;
  };

  // Width montante per vani lana
  const studWidthMm = (() => {
    const studBlock = model.blocks.find(b => b.kind === 'structure');
    if (studBlock && studBlock.kind === 'structure') return studBlock.depthMm > 0 ? Math.min(studBlock.depthMm, 75) : 75;
    return 75;
  })();

  return (
    <Card className="p-0 overflow-hidden bg-white">
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
        <SVGPatternsDefs />
        <rect x={0} y={0} width={VB_W} height={VB_H} fill="#ffffff" />

        {/* === HEADER === */}
        <g>
          <text x={PAD_LEFT} y={32} fontSize={18} fontWeight={700} fill="#0F172A" fontFamily="Inter, system-ui, sans-serif">
            Vista in pianta
          </text>
          <text x={PAD_LEFT} y={50} fontSize={9} fill="#94A3B8" fontFamily="Inter, system-ui, sans-serif" letterSpacing="0.1em">
            SEZIONE ORIZZONTALE · INTERASSE MONTANTI {studSpacingMm}mm · LUNGHEZZA VISUALIZZATA {(wallLengthMm / 1000).toFixed(1)}m
          </text>
          <line x1={PAD_LEFT} y1={HEADER_H - 8} x2={VB_W - PAD_RIGHT} y2={HEADER_H - 8} stroke="#E2E8F0" strokeWidth={0.5} />
        </g>

        {/* === ETICHETTE LATO A / LATO B === */}
        <g>
          <text
            x={wallX - 16}
            y={wallY + drawnBlocks[0].yStart * scaleY + (drawnBlocks[0].depthMm * scaleY) / 2 + 4}
            fontSize={11}
            fill="#0F172A"
            fontFamily="Inter, system-ui, sans-serif"
            textAnchor="end"
            fontWeight={700}
          >
            ↑ LATO A
          </text>
          <text
            x={wallX - 16}
            y={wallY + drawnBlocks[0].yStart * scaleY + (drawnBlocks[0].depthMm * scaleY) / 2 + 18}
            fontSize={9}
            fill="#64748B"
            fontFamily="Inter, system-ui, sans-serif"
            textAnchor="end"
          >
            esterno
          </text>
          <text
            x={wallX - 16}
            y={wallY + wallH - drawnBlocks[drawnBlocks.length - 1].depthMm * scaleY / 2 + 4}
            fontSize={11}
            fill="#0F172A"
            fontFamily="Inter, system-ui, sans-serif"
            textAnchor="end"
            fontWeight={700}
          >
            ↓ LATO B
          </text>
          <text
            x={wallX - 16}
            y={wallY + wallH - drawnBlocks[drawnBlocks.length - 1].depthMm * scaleY / 2 + 18}
            fontSize={9}
            fill="#64748B"
            fontFamily="Inter, system-ui, sans-serif"
            textAnchor="end"
          >
            interno
          </text>
        </g>

        {/* === DISEGNO PARETE === */}
        <g>
          {drawnBlocks.map((db, idx) => {
            const yPx = wallY + db.yStart * scaleY;
            const heightPx = db.depthMm * scaleY;

            if (db.block.kind === 'board' || db.block.kind === 'orphan_insulation') {
              // Lastra: fascia orizzontale continua lungo tutta la lunghezza
              return (
                <g key={idx}>
                  <rect
                    x={wallX}
                    y={yPx}
                    width={wallW}
                    height={heightPx}
                    fill={fillFor(db.block)}
                    stroke={db.block.kind === 'orphan_insulation' ? '#DC2626' : '#1F2937'}
                    strokeWidth={0.7}
                    strokeDasharray={db.block.kind === 'orphan_insulation' ? '4 3' : undefined}
                  />
                  {/* Etichetta nome */}
                  {heightPx > 8 && (
                    <text
                      x={wallX + wallW - 12}
                      y={yPx + heightPx / 2 + 4}
                      fontSize={10}
                      fill={db.block.kind === 'orphan_insulation' ? '#991B1B' : '#1F2937'}
                      fontFamily="Inter, system-ui, sans-serif"
                      textAnchor="end"
                      fontWeight={500}
                      opacity={0.85}
                    >
                      {labelOf(db.block).slice(0, 28)}
                    </text>
                  )}
                  {/* Quota spessore singola riga */}
                  <text
                    x={wallX + 8}
                    y={yPx + heightPx / 2 + 4}
                    fontSize={9}
                    fill="#475569"
                    fontFamily="ui-monospace, monospace"
                    fontWeight={600}
                  >
                    {db.depthMm} mm
                  </text>
                </g>
              );
            }

            if (db.block.kind === 'structure') {
              // Struttura: lana di sfondo + montanti C in sezione orizzontale
              const insulationFill = db.block.insulationFillId
                ? `url(#${db.block.insulationFillId})`
                : '#F4F4F5';
              return (
                <g key={idx}>
                  {/* Background isolante (vani fra montanti) */}
                  <rect
                    x={wallX}
                    y={yPx}
                    width={wallW}
                    height={heightPx}
                    fill={insulationFill}
                    stroke="#1F2937"
                    strokeWidth={0.7}
                  />
                  {/* Montanti C in sezione orizzontale: 1 sezione "C" per ogni stud */}
                  {studPositions.map((studXmm, si) => {
                    const studXPx = wallX + studXmm * scaleX;
                    const studWPx = Math.max(2, 2 * scaleY); // spessore lamiera × scaleY (mm)
                    return (
                      <g key={`stud-${si}`}>
                        {/* Anima del C (perpendicolare alla parete) */}
                        <rect
                          x={studXPx - studWPx / 2}
                          y={yPx + heightPx * 0.05}
                          width={studWPx}
                          height={heightPx * 0.9}
                          fill="url(#grad-metal)"
                          stroke="#3F4756"
                          strokeWidth={0.4}
                        />
                        {/* Ali superiore e inferiore (parallele alla parete) */}
                        <rect
                          x={studXPx - studWPx * 4}
                          y={yPx + heightPx * 0.05}
                          width={studWPx * 8}
                          height={studWPx}
                          fill="url(#grad-metal)"
                          stroke="#3F4756"
                          strokeWidth={0.4}
                        />
                        <rect
                          x={studXPx - studWPx * 4}
                          y={yPx + heightPx * 0.95 - studWPx}
                          width={studWPx * 8}
                          height={studWPx}
                          fill="url(#grad-metal)"
                          stroke="#3F4756"
                          strokeWidth={0.4}
                        />
                      </g>
                    );
                  })}
                  {/* Etichetta struttura */}
                  <text
                    x={wallX + wallW - 12}
                    y={yPx + heightPx / 2 + 4}
                    fontSize={10}
                    fill="#1F2937"
                    fontFamily="Inter, system-ui, sans-serif"
                    textAnchor="end"
                    fontWeight={600}
                    opacity={0.85}
                  >
                    {labelOf(db.block).slice(0, 28)}
                    {db.block.insulationLabel ? ` + ${db.block.insulationLabel.slice(0, 18)}` : ''}
                  </text>
                  <text
                    x={wallX + 8}
                    y={yPx + heightPx / 2 + 4}
                    fontSize={9}
                    fill="#475569"
                    fontFamily="ui-monospace, monospace"
                    fontWeight={600}
                  >
                    {db.depthMm} mm
                  </text>
                </g>
              );
            }

            return null;
          })}
        </g>

        {/* === QUOTE INTERASSE MONTANTI (sopra la parete) === */}
        <g>
          {studPositions.map((studXmm, i) => {
            if (i === 0) return null;
            const xPrev = wallX + studPositions[i - 1] * scaleX;
            const xCurr = wallX + studXmm * scaleX;
            const yQuote = wallY - 24;
            return (
              <g key={`quote-${i}`}>
                <line x1={xPrev} y1={yQuote} x2={xCurr} y2={yQuote} stroke="#475569" strokeWidth={0.5} />
                <line x1={xPrev} y1={yQuote - 4} x2={xPrev} y2={yQuote + 4} stroke="#475569" strokeWidth={0.5} />
                <line x1={xCurr} y1={yQuote - 4} x2={xCurr} y2={yQuote + 4} stroke="#475569" strokeWidth={0.5} />
                <rect
                  x={(xPrev + xCurr) / 2 - 22}
                  y={yQuote - 9}
                  width={44}
                  height={14}
                  fill="#FFFFFF"
                  opacity={0.95}
                />
                <text
                  x={(xPrev + xCurr) / 2}
                  y={yQuote + 1}
                  fontSize={9}
                  fill="#475569"
                  fontFamily="ui-monospace, monospace"
                  textAnchor="middle"
                  fontWeight={600}
                >
                  {studSpacingMm}
                </text>
              </g>
            );
          })}
          {/* Indicazione asse-asse */}
          {studPositions.length > 1 && (
            <text
              x={wallX + (studPositions[0] + studPositions[1]) / 2 * scaleX}
              y={wallY - 36}
              fontSize={8}
              fill="#94A3B8"
              fontFamily="Inter, system-ui, sans-serif"
              textAnchor="middle"
              letterSpacing="0.05em"
            >
              INTERASSE
            </text>
          )}
        </g>

        {/* === QUOTA SPESSORE PARETE (a destra) === */}
        <g>
          <line
            x1={wallX + wallW + 30}
            y1={wallY}
            x2={wallX + wallW + 30}
            y2={wallY + wallH}
            stroke="#0F172A"
            strokeWidth={0.8}
          />
          <line x1={wallX + wallW + 26} y1={wallY} x2={wallX + wallW + 34} y2={wallY} stroke="#0F172A" strokeWidth={0.8} />
          <line
            x1={wallX + wallW + 26}
            y1={wallY + wallH}
            x2={wallX + wallW + 34}
            y2={wallY + wallH}
            stroke="#0F172A"
            strokeWidth={0.8}
          />
          <text
            x={wallX + wallW + 42}
            y={wallY + wallH / 2 + 4}
            fontSize={11}
            fill="#0F172A"
            fontFamily="Inter, system-ui, sans-serif"
            fontWeight={700}
          >
            {totalThickness.toFixed(0)} mm
          </text>
          <text
            x={wallX + wallW + 42}
            y={wallY + wallH / 2 + 18}
            fontSize={8}
            fill="#94A3B8"
            fontFamily="Inter, system-ui, sans-serif"
            letterSpacing="0.05em"
          >
            SPESSORE
          </text>
        </g>

        {/* === QUOTA LUNGHEZZA TOTALE (sotto la parete) === */}
        <g>
          <line x1={wallX} y1={wallY + wallH + 24} x2={wallX + wallW} y2={wallY + wallH + 24} stroke="#0F172A" strokeWidth={0.8} />
          <line x1={wallX} y1={wallY + wallH + 20} x2={wallX} y2={wallY + wallH + 28} stroke="#0F172A" strokeWidth={0.8} />
          <line
            x1={wallX + wallW}
            y1={wallY + wallH + 20}
            x2={wallX + wallW}
            y2={wallY + wallH + 28}
            stroke="#0F172A"
            strokeWidth={0.8}
          />
          <rect
            x={wallX + wallW / 2 - 36}
            y={wallY + wallH + 16}
            width={72}
            height={16}
            fill="#FFFFFF"
            opacity={0.95}
          />
          <text
            x={wallX + wallW / 2}
            y={wallY + wallH + 28}
            fontSize={11}
            fill="#0F172A"
            fontFamily="Inter, system-ui, sans-serif"
            textAnchor="middle"
            fontWeight={700}
          >
            {(wallLengthMm / 1000).toFixed(2)} m
          </text>
        </g>

        {/* === FOOTER === */}
        <g>
          <line x1={PAD_LEFT} y1={VB_H - FOOTER_H + 6} x2={VB_W - PAD_RIGHT} y2={VB_H - FOOTER_H + 6} stroke="#E2E8F0" strokeWidth={0.5} />
          <text x={PAD_LEFT} y={VB_H - FOOTER_H + 24} fontSize={9} fill="#64748B" fontFamily="Inter, system-ui, sans-serif">
            {studPositions.length} montanti visualizzati · profilo C in sezione orizzontale · larghezza {studWidthMm}mm
          </text>
          <text x={PAD_LEFT} y={VB_H - FOOTER_H + 38} fontSize={9} fill="#94A3B8" fontFamily="Inter, system-ui, sans-serif">
            Vista in pianta generata automaticamente · DryConfig
          </text>
        </g>
      </svg>
    </Card>
  );
};

export default PlanView;

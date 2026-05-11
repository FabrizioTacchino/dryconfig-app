import React, { useMemo } from 'react';
import SVGPatternsDefs from '../visualization/section-view/SVGPatternsDefs';
import {
  buildWallSectionModel,
  type WallBlock,
} from '../visualization/section-view/wallModel';
import {
  BoardRect,
  StructureGroup,
  OrphanInsulationRect,
} from '../visualization/section-view/TechnicalWallDrawing';
import type { LayerV2 } from '../types';

interface MiniSectionPreviewProps {
  layers: LayerV2[];
  className?: string;
}

/**
 * Anteprima miniaturizzata della sezione tecnica per le card della lista
 * stratigrafie V2.
 *
 * Riusa le STESSE primitive grafiche della tavola tecnica grande
 * (`BoardRect`, `StructureGroup`, `OrphanInsulationRect`) con lo stesso
 * `wallModel` e gli stessi `SVGPatternsDefs`. Quindi quello che vedi nella
 * card è graficamente identico a quello che vedi quando apri la stratigrafia
 * nel configuratore — solo a dimensione thumbnail e senza header/quote/legenda.
 */
const MiniSectionPreview: React.FC<MiniSectionPreviewProps> = ({ layers, className = '' }) => {
  // Ordine layer per `position`: il join Supabase non garantisce l'ordine, e
  // `buildWallSectionModel` aggrega struct+guida+isolante solo se consecutivi.
  const orderedLayers = useMemo(() => {
    const arr = [...(layers ?? [])];
    arr.sort((a: any, b: any) => Number(a?.position ?? 0) - Number(b?.position ?? 0));
    return arr;
  }, [layers]);
  const model = useMemo(() => buildWallSectionModel(orderedLayers), [orderedLayers]);

  // ===== Layout SVG =====
  // Ratio 4:3 verticale per ogni "fascia parete"; la card della lista ospiterà
  // il SVG con preserveAspectRatio default ("xMidYMid meet") così le proporzioni
  // dei pattern vengono rispettate.
  const VB_W = 240;
  const VB_H = 120;
  const PAD_X = 6;
  const PAD_Y = 8;
  const drawW = VB_W - PAD_X * 2;
  const drawH = VB_H - PAD_Y * 2;

  if (model.blocks.length === 0) {
    return (
      <div
        className={`flex items-center justify-center bg-zinc-50 text-[10px] text-zinc-400 ${className}`}
      >
        Nessun layer
      </div>
    );
  }

  const totalThickness = Math.max(model.totalThicknessMm, 25);

  // Calcolo posizione X dei blocchi
  type DrawBlock = { block: WallBlock; x: number; w: number };
  const drawBlocks: DrawBlock[] = [];
  let cursor = PAD_X;
  for (const b of model.blocks) {
    const sizeMm = b.kind === 'board' ? b.thicknessMm : b.depthMm;
    const w = (sizeMm / totalThickness) * drawW;
    drawBlocks.push({ block: b, x: cursor, w });
    cursor += w;
  }

  // Numero strutture per badge "Orditura N" se doppia
  const totalStructures = model.blocks.filter(b => b.kind === 'structure').length;

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <SVGPatternsDefs />

      {/* sfondo bianco pulito */}
      <rect x={0} y={0} width={VB_W} height={VB_H} fill="#ffffff" />

      {/* === DISEGNO PARETE === */}
      <g>
        {drawBlocks.map(({ block, x, w }, idx) => {
          if (block.kind === 'board') {
            return (
              <BoardRect
                key={idx}
                block={block}
                x={x}
                y={PAD_Y}
                w={w}
                h={drawH}
              />
            );
          }
          if (block.kind === 'structure') {
            const ordinal = drawBlocks
              .slice(0, idx + 1)
              .filter(d => d.block.kind === 'structure').length;
            return (
              <StructureGroup
                key={idx}
                block={block}
                x={x}
                y={PAD_Y}
                w={w}
                h={drawH}
                studsCount={1}
                structureOrdinal={ordinal}
                showOrdinal={totalStructures > 1}
              />
            );
          }
          return (
            <OrphanInsulationRect
              key={idx}
              block={block}
              x={x}
              y={PAD_Y}
              w={w}
              h={drawH}
            />
          );
        })}
      </g>

      {/* === ETICHETTE LATO A / LATO B (sottilissime, ai margini superiori) === */}
      <g>
        <text
          x={PAD_X}
          y={PAD_Y - 1}
          fontSize={6}
          fill="#94A3B8"
          fontFamily="Inter, system-ui, sans-serif"
          letterSpacing="0.1em"
        >
          A
        </text>
        <text
          x={VB_W - PAD_X}
          y={PAD_Y - 1}
          fontSize={6}
          fill="#94A3B8"
          fontFamily="Inter, system-ui, sans-serif"
          textAnchor="end"
          letterSpacing="0.1em"
        >
          B
        </text>
      </g>
    </svg>
  );
};

export default MiniSectionPreview;

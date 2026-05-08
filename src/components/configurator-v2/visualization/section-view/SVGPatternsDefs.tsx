import React from 'react';

/**
 * Definizioni SVG <pattern> + <linearGradient> per la tavola tecnica.
 *
 * Vedi `docs/mockupui.md` §14. Stile catalogo Knauf/Gyproc:
 *  - Cartongesso: avorio chiaro pulito (no tratteggio fitto)
 *  - Lana minerale: pattern sinusoidale "matassa"
 *  - Lana di vetro: tratteggio incrociato leggero
 *  - EPS/XPS: puntinato denso
 *  - Lastra forata acustica: pattern fori
 *  - Metallo zincato: gradiente lineare per dare 3D
 *  - Calcestruzzo: puntinato grigio (per solaio/pavimento)
 *  - Membrana: nessun pattern (linea sottile)
 *
 * Tutti i pattern sono `userSpaceOnUse` per scalare correttamente con il viewBox.
 */
const SVGPatternsDefs: React.FC = () => (
  <defs>
    {/* === GESSO RIVESTITO (cartongesso standard, GKB) === */}
    <linearGradient id="grad-board-std" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#FAF6EE" />
      <stop offset="100%" stopColor="#F0E9D8" />
    </linearGradient>

    {/* === GESSO IGNIFUGO (rosa salmone) === */}
    <linearGradient id="grad-board-fire" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#F8DDD9" />
      <stop offset="100%" stopColor="#EFC4BE" />
    </linearGradient>

    {/* === GESSO IDRO (azzurro acqua) === */}
    <linearGradient id="grad-board-hydro" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#DDEBF5" />
      <stop offset="100%" stopColor="#BAD3E5" />
    </linearGradient>

    {/* === GESSO ALTA DENSITÀ (avorio scuro) === */}
    <linearGradient id="grad-board-hd" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#EFE4D2" />
      <stop offset="100%" stopColor="#DCD0BC" />
    </linearGradient>

    {/* === LASTRA CEMENTIZIA (Aquaroc) === */}
    <linearGradient id="grad-board-cement" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#D6CFC0" />
      <stop offset="100%" stopColor="#BDB6A6" />
    </linearGradient>

    {/* === GLASROC X (velo vetro) === */}
    <linearGradient id="grad-board-glasroc" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#E2EEDC" />
      <stop offset="100%" stopColor="#C7D9BD" />
    </linearGradient>

    {/* === LASTRA FORATA ACUSTICA === */}
    <pattern id="pat-board-perforated" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(0)">
      <rect width="6" height="6" fill="url(#grad-board-std)" />
      <circle cx="3" cy="3" r="0.9" fill="#9CA3AF" opacity="0.6" />
    </pattern>

    {/* === LANA DI ROCCIA (sinusoidale gialla) === */}
    <pattern id="pat-rockwool" patternUnits="userSpaceOnUse" width="10" height="6">
      <rect width="10" height="6" fill="#FDE68A" />
      <path
        d="M0,3 Q2.5,0 5,3 T10,3"
        stroke="#A87D00"
        strokeWidth="0.5"
        fill="none"
      />
      <path
        d="M0,5 Q2.5,2 5,5 T10,5"
        stroke="#A87D00"
        strokeWidth="0.4"
        fill="none"
        opacity="0.6"
      />
    </pattern>

    {/* === LANA DI VETRO (più chiara, tratteggio incrociato) === */}
    <pattern id="pat-glasswool" patternUnits="userSpaceOnUse" width="6" height="6">
      <rect width="6" height="6" fill="#FFF3B8" />
      <path d="M0,0 L6,6" stroke="#C49B00" strokeWidth="0.3" opacity="0.5" />
      <path d="M6,0 L0,6" stroke="#C49B00" strokeWidth="0.3" opacity="0.5" />
    </pattern>

    {/* === EPS / XPS (puntinato denso) === */}
    <pattern id="pat-eps" patternUnits="userSpaceOnUse" width="3" height="3">
      <rect width="3" height="3" fill="#F5F5F5" />
      <circle cx="1.5" cy="1.5" r="0.4" fill="#9CA3AF" />
    </pattern>

    {/* === PIR/PUR (arancio chiaro tratteggio) === */}
    <pattern id="pat-pir" patternUnits="userSpaceOnUse" width="6" height="6">
      <rect width="6" height="6" fill="#FFD6A5" />
      <path d="M0,0 L6,6" stroke="#C97700" strokeWidth="0.3" opacity="0.4" />
    </pattern>

    {/* === METALLO ZINCATO (gradient + linee fini) === */}
    <linearGradient id="grad-metal" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="#7C8593" />
      <stop offset="40%" stopColor="#B0B7C3" />
      <stop offset="60%" stopColor="#B0B7C3" />
      <stop offset="100%" stopColor="#7C8593" />
    </linearGradient>

    {/* === CALCESTRUZZO (solaio/pavimento) === */}
    <pattern id="pat-concrete" patternUnits="userSpaceOnUse" width="8" height="8">
      <rect width="8" height="8" fill="#D4D4D8" />
      <circle cx="2" cy="2" r="0.5" fill="#71717A" opacity="0.6" />
      <circle cx="6" cy="4" r="0.7" fill="#71717A" opacity="0.5" />
      <circle cx="3" cy="6" r="0.4" fill="#71717A" opacity="0.6" />
      <circle cx="7" cy="7" r="0.3" fill="#71717A" opacity="0.5" />
    </pattern>

    {/* === OSB === */}
    <pattern id="pat-osb" patternUnits="userSpaceOnUse" width="14" height="6">
      <rect width="14" height="6" fill="#D4A574" />
      <path d="M0,1 L4,1.5 L8,1 L11,1.5 L14,1" stroke="#8B5E2B" strokeWidth="0.4" fill="none" opacity="0.7" />
      <path d="M0,3.5 L5,4 L9,3.5 L14,4" stroke="#8B5E2B" strokeWidth="0.3" fill="none" opacity="0.6" />
    </pattern>

    {/* === MEMBRANA ACUSTICA === */}
    <linearGradient id="grad-membrane" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#475569" />
      <stop offset="100%" stopColor="#334155" />
    </linearGradient>

    {/* === BARRIERA VAPORE === */}
    <linearGradient id="grad-vapor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#A78BFA" />
      <stop offset="100%" stopColor="#7C3AED" />
    </linearGradient>

    {/* Drop shadow leggera */}
    <filter id="soft-shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="0.8" />
      <feOffset dx="0.5" dy="0.8" result="offsetblur" />
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.25" />
      </feComponentTransfer>
      <feMerge>
        <feMergeNode />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
);

export default SVGPatternsDefs;

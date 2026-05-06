
import React from 'react';

interface TotalThicknessQuoteProps {
  totalThickness: number;
  scale: number;
}

const TotalThicknessQuote = ({ totalThickness, scale }: TotalThicknessQuoteProps) => {
  return (
    <g>
      <line x1="10" y1="210" x2={10 + totalThickness * scale} y2="210" stroke="#059669" strokeWidth="2" />
      <line x1="10" y1="205" x2="10" y2="215" stroke="#059669" strokeWidth="2" />
      <line x1={10 + totalThickness * scale} y1="205" x2={10 + totalThickness * scale} y2="215" stroke="#059669" strokeWidth="2" />
      <text
        x={10 + (totalThickness * scale) / 2}
        y="230"
        textAnchor="middle"
        fontSize="12"
        fill="#059669"
        fontWeight="600"
      >
        Totale: {totalThickness}mm
      </text>
    </g>
  );
};

export default TotalThicknessQuote;

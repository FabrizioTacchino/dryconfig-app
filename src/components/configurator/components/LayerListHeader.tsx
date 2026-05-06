
import React from 'react';

interface LayerListHeaderProps {
  title?: string;
}

const LayerListHeader = ({ title = "Composizione Stratigrafia" }: LayerListHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <h3 className="font-medium">{title}</h3>
    </div>
  );
};

export default LayerListHeader;

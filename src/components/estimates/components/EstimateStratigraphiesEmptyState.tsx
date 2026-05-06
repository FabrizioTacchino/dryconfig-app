
import React from 'react';
import { Eye } from 'lucide-react';

const EstimateStratigraphiesEmptyState = () => {
  return (
    <div className="text-center py-12 text-muted-foreground border border-dashed border-gray-200 rounded-lg">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
          <Eye className="w-8 h-8 text-gray-400" />
        </div>
        <div>
          <p className="text-lg font-medium">Nessuna stratigrafia presente</p>
          <p className="text-sm mt-1">Aggiungi stratigrafie dal configuratore per iniziare</p>
        </div>
      </div>
    </div>
  );
};

export default EstimateStratigraphiesEmptyState;

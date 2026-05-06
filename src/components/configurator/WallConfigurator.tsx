
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import StratigraphyTab from './StratigraphyTab';
import CertifiedStratigraphyTab from './CertifiedStratigraphyTab';
import StratigraphyBuilder from './StratigraphyBuilder';
import StratigraphyTabHeader from './components/StratigraphyTabHeader';
import { WallType } from '@/types';

interface WallConfiguratorProps {
  estimateId: string | null;
  editingStratigraphy?: any;
  initialStratigraphyId?: string | null;
  viewOnly?: boolean;
}

const WallConfigurator = ({
  estimateId,
  editingStratigraphy,
  initialStratigraphyId,
  viewOnly = false
}: WallConfiguratorProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentSection = searchParams.get('tab') || 'stratigraphies';
  const [selectedWallType, setSelectedWallType] = useState<WallType | 'all'>('all');
  
  // 🔥 NEW: Check for certified stratigraphy edit parameter
  const editCertifiedStratigraphyId = searchParams.get('editCertifiedStratigraphy');
  const isCertifiedEdit = !!editCertifiedStratigraphyId;

  console.log('[WallConfigurator] Parameters:', {
    currentSection,
    editCertifiedStratigraphyId,
    isCertifiedEdit,
    editingStratigraphy
  });

  // Debug del editing stratigraphy
  useEffect(() => {
    if (editingStratigraphy) {
      console.log('WallConfigurator - editingStratigraphy received:', editingStratigraphy);
      if (editingStratigraphy.stratigraphy?.type) {
        console.log('Setting wall type to:', editingStratigraphy.stratigraphy.type);
        setSelectedWallType(editingStratigraphy.stratigraphy.type);
      }
    }
  }, [editingStratigraphy]);

  const handleSectionChange = (section: string) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('tab', section);
      return newParams;
    });
  };

  const handleWallTypeChange = (wallType: WallType | 'all') => {
    setSelectedWallType(wallType);
  };

  const handleCreateNew = () => {
    handleSectionChange('builder');
  };

  // In modalità viewOnly, mostra solo la stratigrafia in builder senza navigazione e testo informativo
  if (viewOnly) {
    return (
      <div className="space-y-6">
        <div className="border rounded-lg p-4 bg-blue-50">
          <h3 className="text-lg font-semibold text-center mb-2">Visualizzazione Stratigrafia</h3>
          <p className="text-center font-semibold text-xl text-red-500">(Modalità di sola lettura)</p>
        </div>
        
        <StratigraphyBuilder 
          editingStratigraphy={editingStratigraphy} 
          initialStratigraphyId={initialStratigraphyId} 
          viewOnly={true} 
        />
      </div>
    );
  }

  // 🔥 HANDLE CERTIFIED STRATIGRAPHY EDIT MODE
  if (currentSection === 'certified' && isCertifiedEdit) {
    console.log('[WallConfigurator] Rendering CERTIFIED EDIT mode');
    return (
      <div className="space-y-6">
        {estimateId && (
          <div className="border rounded-lg p-4 bg-blue-50">
            <p className="text-sm text-center text-muted-foreground">
              Le stratigrafie configurate verranno aggiunte a questo preventivo
            </p>
          </div>
        )}

        {/* Sezione principale con tre colonne - evidenzia certificata */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Ricerca Stratigrafia */}
          <div className={`border rounded-lg p-4 cursor-pointer transition-all hover:border-gray-300`} 
               onClick={() => handleSectionChange('stratigraphies')}>
            <h3 className="text-lg font-semibold text-center mb-2">Ricerca Stratigrafia</h3>
          </div>

          {/* Inserisci Stratigrafia Certificata - ACTIVE */}
          <div className={`border rounded-lg p-4 cursor-pointer transition-all border-blue-500 bg-blue-50`}>
            <h3 className="text-lg font-semibold text-center mb-2">Modifica Stratigrafia Certificata</h3>
          </div>

          {/* Inserisci Stratigrafia Personalizzata */}
          <div className={`border rounded-lg p-4 cursor-pointer transition-all hover:border-gray-300`} 
               onClick={() => handleSectionChange('builder')}>
            <h3 className="text-lg font-semibold text-center mb-2">Inserisci Stratigrafia Personalizzata</h3>
          </div>
        </div>
        
        <CertifiedStratigraphyTab editingStratigraphy={editingStratigraphy} />
      </div>
    );
  }

  if (currentSection === 'builder') {
    return (
      <div className="space-y-6">
        {/* Hide estimate info text when not viewing an estimate */}
        {estimateId && (
          <div className="border rounded-lg p-4 bg-blue-50">
            <p className="text-sm text-center text-muted-foreground">
              Le stratigrafie configurate verranno aggiunte a questo preventivo
            </p>
          </div>
        )}

        {/* Sezione principale con tre colonne - anche per builder */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Ricerca Stratigrafia */}
          <div className={`border rounded-lg p-4 cursor-pointer transition-all hover:border-gray-300`} 
               onClick={() => handleSectionChange('stratigraphies')}>
            <h3 className="text-lg font-semibold text-center mb-2">Ricerca Stratigrafia</h3>
          </div>

          {/* Inserisci Stratigrafia Certificata */}
          <div className={`border rounded-lg p-4 cursor-pointer transition-all hover:border-gray-300`} 
               onClick={() => handleSectionChange('certified')}>
            <h3 className="text-lg font-semibold text-center mb-2">Inserisci Stratigrafia Certificata</h3>
          </div>

          {/* Inserisci Stratigrafia Personalizzata */}
          <div className={`border rounded-lg p-4 cursor-pointer transition-all border-blue-500 bg-blue-50`}>
            <h3 className="text-lg font-semibold text-center mb-2">Inserisci Stratigrafia Personalizzata</h3>
          </div>
        </div>
        
        <StratigraphyBuilder 
          estimateId={estimateId} 
          editingStratigraphy={editingStratigraphy} 
          initialStratigraphyId={initialStratigraphyId} 
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Show estimate info text for regular navigation */}
      {estimateId && (
        <div className="border rounded-lg p-4 bg-blue-50">
          <p className="text-sm text-center text-muted-foreground">
            Le stratigrafie configurate verranno aggiunte a questo preventivo
          </p>
        </div>
      )}

      {/* Sezione principale con tre colonne */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Ricerca Stratigrafia */}
        <div className={`border rounded-lg p-4 cursor-pointer transition-all ${
          currentSection === 'stratigraphies' ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-300'
        }`} onClick={() => handleSectionChange('stratigraphies')}>
          <h3 className="text-lg font-semibold text-center mb-2">Ricerca Stratigrafia</h3>
        </div>

        {/* Inserisci Stratigrafia Certificata */}
        <div className={`border rounded-lg p-4 cursor-pointer transition-all ${
          currentSection === 'certified' ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-300'
        }`} onClick={() => handleSectionChange('certified')}>
          <h3 className="text-lg font-semibold text-center mb-2">Inserisci Stratigrafia Certificata</h3>
        </div>

        {/* Inserisci Stratigrafia Personalizzata */}
        <div className={`border rounded-lg p-4 cursor-pointer transition-all ${
          currentSection === 'builder' ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-300'
        }`} onClick={() => handleSectionChange('builder')}>
          <h3 className="text-lg font-semibold text-center mb-2">Inserisci Stratigrafia Personalizzata</h3>
        </div>
      </div>

      {/* Contenuto della sezione selezionata */}
      {currentSection === 'stratigraphies' && (
        <StratigraphyTab 
          wallType={selectedWallType} 
          onWallTypeChange={handleWallTypeChange} 
          estimateId={estimateId} 
          editingStratigraphy={editingStratigraphy} 
          initialStratigraphyId={initialStratigraphyId} 
        />
      )}

      {currentSection === 'certified' && <CertifiedStratigraphyTab />}
    </div>
  );
};

export default WallConfigurator;

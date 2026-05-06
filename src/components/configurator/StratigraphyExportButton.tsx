import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { DatabaseStratigraphy } from '@/hooks/useStratigraphies';
import { exportStratigraphyToExcel } from '@/utils/export';
import { useToast } from '@/hooks/use-toast';

interface StratigraphyExportButtonProps {
  stratigraphy: DatabaseStratigraphy;
  layers?: any[];
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

const StratigraphyExportButton = ({ 
  stratigraphy, 
  layers, 
  variant = 'outline', 
  size = 'sm' 
}: StratigraphyExportButtonProps) => {
  const { toast } = useToast();

  const handleExport = () => {
    try {
      exportStratigraphyToExcel(stratigraphy, layers);
      toast({
        title: 'Export completato',
        description: 'I dati tecnici della stratigrafia sono stati esportati con successo.',
      });
    } catch (error) {
      console.error('Error exporting stratigraphy:', error);
      toast({
        title: 'Errore durante l\'export',
        description: 'Si è verificato un errore durante l\'export della stratigrafia.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Button 
      variant={variant} 
      size={size} 
      onClick={handleExport}
    >
      <Download className="h-4 w-4 mr-2" />
      Esporta Dati
    </Button>
  );
};

export default StratigraphyExportButton;


import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { Estimate } from '@/types';
import { EstimateStratigraphy } from '@/types/estimateStratigraphy';
import { useToast } from '@/hooks/use-toast';
import {
  exportEstimateStratigraphiesToPDF,
  exportEstimateStratigraphiesToExcel,
} from '@/utils/export';

interface ExportDropdownProps {
  estimate: Estimate;
  stratigraphies?: (EstimateStratigraphy & { stratigraphy?: any })[];
}

const ExportDropdown = ({ estimate, stratigraphies = [] }: ExportDropdownProps) => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    try {
      await exportEstimateStratigraphiesToPDF(estimate, stratigraphies);
      toast({
        title: 'Esportazione PDF completata',
        description: 'Il PDF del preventivo è stato scaricato con successo.',
      });
    } catch (err) {
      console.error('Errore export PDF:', err);
      toast({
        title: 'Errore durante esportazione PDF',
        description: 'Si è verificato un errore durante la generazione del PDF.',
        variant: 'destructive',
      });
    }
  };

  const handleExportExcel = async () => {
    try {
      await exportEstimateStratigraphiesToExcel(estimate, stratigraphies);
      toast({
        title: 'Esportazione Excel completata',
        description: "Il file Excel è stato generato e scaricato.",
      });
    } catch (err) {
      console.error('Errore export Excel:', err);
      toast({
        title: 'Errore durante esportazione Excel',
        description: 'Si è verificato un errore nella generazione del file.',
        variant: 'destructive',
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2" disabled={isExporting}>
          <Download className="h-4 w-4" />
          {isExporting ? 'Generando...' : 'Esporta'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-white">
        <DropdownMenuItem onClick={handleExportPDF} className="gap-2">
          <FileText className="h-4 w-4" />
          Esporta PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportExcel} className="gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          Esporta Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExportDropdown;

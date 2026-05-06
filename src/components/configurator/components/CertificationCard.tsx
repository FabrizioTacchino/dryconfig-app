
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, Volume2, FileText, Calendar, Building2, User } from 'lucide-react';
import { CertificationData } from '@/types/certification';

interface CertificationCardProps {
  certification: CertificationData;
  onSelect: (certification: CertificationData) => void;
  isSelected?: boolean;
}

const CertificationCard = ({ certification, onSelect, isSelected = false }: CertificationCardProps) => {
  const isExpiringSoon = certification.expiry_date && 
    new Date(certification.expiry_date) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 giorni

  return (
    <Card className={`cursor-pointer transition-all hover:shadow-lg ${isSelected ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{certification.name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Codice: {certification.code} • {certification.certifier}
            </p>
          </div>
          <Badge variant={isExpiringSoon ? "destructive" : "secondary"}>
            {certification.type}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Prestazioni principali */}
        <div className="grid grid-cols-2 gap-3">
          {certification.value && (
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">{certification.value}</span>
            </div>
          )}
          
          {certification.acoustic_reduction && (
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">{certification.acoustic_reduction} dB</span>
            </div>
          )}
          
          {certification.max_height && (
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-green-500" />
              <span className="text-sm">H max: {certification.max_height}m</span>
            </div>
          )}
          
          {certification.solution_number && (
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-purple-500" />
              <span className="text-sm">Sol. {certification.solution_number}</span>
            </div>
          )}
        </div>

        {/* Informazioni aggiuntive */}
        <div className="space-y-2">
          {certification.supplier_name && (
            <div className="flex items-center gap-2">
              <User className="h-3 w-3 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                Fornitore: {certification.supplier_name}
              </p>
            </div>
          )}
          
          {certification.extension_code && (
            <p className="text-xs text-muted-foreground">
              Estensione: {certification.extension_code}
            </p>
          )}
        </div>

        {/* Date di validità */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>
            Valida fino al {new Date(certification.expiry_date).toLocaleDateString('it-IT')}
          </span>
          {isExpiringSoon && (
            <Badge variant="destructive" className="text-xs">
              In scadenza
            </Badge>
          )}
        </div>

        <Button 
          onClick={() => onSelect(certification)}
          className="w-full"
          variant={isSelected ? "default" : "outline"}
        >
          {isSelected ? 'Selezionata' : 'Seleziona Certificazione'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default CertificationCard;

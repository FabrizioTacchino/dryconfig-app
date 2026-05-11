import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Layers, Sparkles, GitCompareArrows } from 'lucide-react';
import { useUnifiedStratigraphies } from '@/hooks/useUnifiedStratigraphies';
import StratigraphyCardV2 from './StratigraphyCardV2';
import NewStratigraphyWizard from './NewStratigraphyWizard';
import CompareStratigraphiesDialog from './CompareStratigraphiesDialog';

interface StratigraphyListV2Props {
  /** Se valorizzato, le azioni "Apri" porteranno al configuratore con questo estimateId in query. */
  estimateId?: string | null;
}

/**
 * Lista stratigrafie V2: vista di ingresso del configuratore quando non c'è ?id=.
 *
 * Mostra search + filtri (fire, acoustic, supplier, spessore) + griglia di card.
 * Click su card → apre `/configurator-v2?id=<uuid>`.
 * "+ Nuova" → `/configurator-v2?new=true` (placeholder per il wizard 0.3).
 */
const StratigraphyListV2: React.FC<StratigraphyListV2Props> = ({ estimateId }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showWizard, setShowWizard] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const {
    stratigraphies,
    isLoading,
    totalCount,
    certifiedCount,
    customCount,
    searchTerm,
    setSearchTerm,
    materialSearchTerm,
    setMaterialSearchTerm,
    fireResistance,
    setFireResistance,
    acousticReduction,
    setAcousticReduction,
    supplierName,
    setSupplierName,
    thicknessRange,
    setThicknessRange,
    showCertifiedOnly,
    setShowCertifiedOnly,
    showCustomOnly,
    setShowCustomOnly,
  } = useUnifiedStratigraphies('all');

  // Filtro automatico se l'utente arriva con `?filter=certified` (dal wizard 0.3)
  useEffect(() => {
    if (searchParams.get('filter') === 'certified' && !showCertifiedOnly) {
      setShowCertifiedOnly(true);
    }
  }, [searchParams, showCertifiedOnly, setShowCertifiedOnly]);

  const openStratigraphy = (id: string) => {
    const params = new URLSearchParams();
    params.set('id', id);
    if (estimateId) params.set('estimate', estimateId);
    navigate(`/configurator?${params.toString()}`);
  };

  const createNew = () => {
    setShowWizard(true);
  };

  return (
    <div className="container mx-auto max-w-screen-2xl px-6 py-6 space-y-5">
      {/* === HERO === */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-1">
            <Sparkles className="h-3 w-3" />
            Configuratore V2
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Le tue stratigrafie</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Ricerca, modifica o crea una nuova stratigrafia per la tua organizzazione.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            onClick={() => setShowCompare(true)}
            size="lg"
            variant="outline"
            disabled={(stratigraphies?.length ?? 0) < 2}
          >
            <GitCompareArrows className="h-4 w-4 mr-1.5" />
            Confronta
          </Button>
          <Button onClick={createNew} size="lg">
            <Plus className="h-4 w-4 mr-1.5" />
            Nuova stratigrafia
          </Button>
        </div>
      </div>

      {/* === FILTRI === */}
      <Card>
        <CardContent className="pt-4 pb-3 space-y-3">
          {/* Riga 1: search testo + materiale */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">
                Cerca per nome o codice
              </Label>
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <Input
                  placeholder="es. W111, Tipo01, parete acustica..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-9 text-sm pl-8"
                />
              </div>
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">
                Cerca per materiale contenuto
              </Label>
              <Input
                placeholder="es. Knauf Diamant, lana di roccia, montante 75..."
                value={materialSearchTerm}
                onChange={(e) => setMaterialSearchTerm(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          </div>

          {/* Riga 2: filtri tecnici */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">
                Resistenza al fuoco
              </Label>
              <Select value={fireResistance || 'all'} onValueChange={setFireResistance}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Tutte" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte</SelectItem>
                  <SelectItem value="EI 30">EI 30</SelectItem>
                  <SelectItem value="EI 60">EI 60</SelectItem>
                  <SelectItem value="EI 90">EI 90</SelectItem>
                  <SelectItem value="EI 120">EI 120</SelectItem>
                  <SelectItem value="EI 180">EI 180</SelectItem>
                  <SelectItem value="EI 240">EI 240</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">
                Abbattimento acustico
              </Label>
              <Select value={acousticReduction || 'all'} onValueChange={setAcousticReduction}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Tutti" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti</SelectItem>
                  <SelectItem value="30">≥ 30 dB</SelectItem>
                  <SelectItem value="40">≥ 40 dB</SelectItem>
                  <SelectItem value="50">≥ 50 dB</SelectItem>
                  <SelectItem value="60">≥ 60 dB</SelectItem>
                  <SelectItem value="70">≥ 70 dB</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">
                Spessore parete
              </Label>
              <Select value={thicknessRange || 'all'} onValueChange={setThicknessRange}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Tutti" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti</SelectItem>
                  <SelectItem value="0-50">0-50 mm</SelectItem>
                  <SelectItem value="51-100">51-100 mm</SelectItem>
                  <SelectItem value="101-150">101-150 mm</SelectItem>
                  <SelectItem value="151-200">151-200 mm</SelectItem>
                  <SelectItem value="200+">200+ mm</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">
                Fornitore
              </Label>
              <Input
                placeholder="es. Knauf, Saint-Gobain..."
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          </div>

          {/* Riga 3: badge totali / certificate / personalizzate */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <Badge
              variant={!showCertifiedOnly && !showCustomOnly ? 'default' : 'outline'}
              className="cursor-pointer text-xs px-2.5 py-0.5"
              onClick={() => {
                setShowCertifiedOnly(false);
                setShowCustomOnly(false);
              }}
            >
              Tutte ({totalCount})
            </Badge>
            <Badge
              variant={showCertifiedOnly ? 'default' : 'outline'}
              className="cursor-pointer text-xs px-2.5 py-0.5"
              onClick={() => {
                setShowCertifiedOnly(!showCertifiedOnly);
                setShowCustomOnly(false);
              }}
            >
              Certificate ({certifiedCount})
            </Badge>
            <Badge
              variant={showCustomOnly ? 'default' : 'outline'}
              className="cursor-pointer text-xs px-2.5 py-0.5"
              onClick={() => {
                setShowCustomOnly(!showCustomOnly);
                setShowCertifiedOnly(false);
              }}
            >
              Personalizzate ({customCount})
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* === GRIGLIA STRATIGRAFIE === */}
      {isLoading ? (
        <Card className="p-12 text-center text-sm text-muted-foreground">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
          Caricamento stratigrafie…
        </Card>
      ) : stratigraphies.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <Layers className="h-12 w-12 mx-auto mb-3 text-zinc-300" />
          <p className="text-sm font-medium text-zinc-700 mb-1">
            {totalCount === 0 ? 'Non hai ancora nessuna stratigrafia' : 'Nessun risultato per i filtri attuali'}
          </p>
          <p className="text-xs text-zinc-500 mb-4">
            {totalCount === 0
              ? 'Crea la tua prima stratigrafia o cercala fra quelle certificate dei cataloghi.'
              : 'Prova a rimuovere alcuni filtri o cambiare i criteri di ricerca.'}
          </p>
          {totalCount === 0 && (
            <Button onClick={createNew} size="sm">
              <Plus className="h-4 w-4 mr-1.5" />
              Crea la prima stratigrafia
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {stratigraphies.map((s) => (
            <StratigraphyCardV2
              key={s.id}
              stratigraphy={s}
              onClick={() => openStratigraphy(s.id)}
            />
          ))}
        </div>
      )}

      <NewStratigraphyWizard
        open={showWizard}
        onOpenChange={setShowWizard}
        estimateId={estimateId}
      />

      <CompareStratigraphiesDialog
        open={showCompare}
        onOpenChange={setShowCompare}
        stratigraphies={stratigraphies}
        initialIds={stratigraphies.slice(0, 2).map((s) => s.id)}
      />
    </div>
  );
};

export default StratigraphyListV2;

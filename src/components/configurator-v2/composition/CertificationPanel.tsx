import React from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ShieldCheck, FileBadge, Volume2, Flame, Thermometer } from 'lucide-react';
import type { CertificationData } from '../hooks/useConfiguratorState';

interface CertificationPanelProps {
  isCertified: boolean;
  certification: CertificationData;
  onChange: (patch: Partial<CertificationData> & { isCertified?: boolean }) => void;
}

/**
 * Pannello inline "Stratigrafia certificata" — sostituisce il dialog modal.
 *
 * Layout:
 *  - Header con toggle Switch + badge stato
 *  - Quando ON: Accordion con 4 sezioni (Identificazione, Acustica, Fuoco,
 *    Termica + Meccanica) con tutti i campi opzionali
 *
 * Tutti i campi sono opzionali: l'utente compila solo ciò che ha dal
 * report di prova reale. I valori certificati popolati sostituiscono
 * automaticamente i placeholder calcolati nelle tab Tecnico ed Export PDF.
 */
const CertificationPanel: React.FC<CertificationPanelProps> = ({
  isCertified,
  certification,
  onChange,
}) => {
  const parseNum = (s: string): number | null => {
    const v = parseFloat(s.replace(',', '.'));
    return Number.isFinite(v) ? v : null;
  };

  return (
    <Card className="overflow-hidden">
      {/* Header con toggle */}
      <div className={`flex items-start justify-between gap-3 p-3 ${
        isCertified ? 'bg-blue-50/40 border-b border-blue-200/50' : 'bg-zinc-50/50 border-b'
      }`}>
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <ShieldCheck className={`h-5 w-5 mt-0.5 shrink-0 ${
            isCertified ? 'text-blue-600' : 'text-zinc-400'
          }`} />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-zinc-900">Stratigrafia certificata</h3>
              {isCertified && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">
                  Attiva
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              {isCertified
                ? 'I valori certificati sostituiscono i placeholder calcolati in tab Tecnico ed Export PDF.'
                : 'Attiva il toggle per inserire i dati di una scheda certificata (Knauf W11x, Gyproc, Siniat, ecc.).'}
            </p>
          </div>
        </div>
        <Switch
          checked={isCertified}
          onCheckedChange={(checked) => onChange({ isCertified: checked })}
          aria-label="Stratigrafia certificata"
        />
      </div>

      {/* Form metadati: visibile solo se attivo */}
      {isCertified && (
        <Accordion type="multiple" defaultValue={['ident']} className="px-3 pb-2">
          {/* === IDENTIFICAZIONE === */}
          <AccordionItem value="ident">
            <AccordionTrigger className="text-xs font-semibold uppercase tracking-wider text-zinc-700">
              <span className="flex items-center gap-2">
                <FileBadge className="h-3.5 w-3.5" />
                Identificazione
              </span>
            </AccordionTrigger>
            <AccordionContent className="pt-2 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <Label htmlFor="cp-code" className="text-[11px]">Codice sistema / test report</Label>
                  <Input
                    id="cp-code"
                    value={certification.certificationCode ?? ''}
                    onChange={(e) => onChange({ certificationCode: e.target.value || null })}
                    placeholder="es. W112.it · ITT-12345-2024"
                    className="h-8 text-xs mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="cp-date" className="text-[11px]">Data test</Label>
                  <Input
                    id="cp-date"
                    type="date"
                    value={certification.certificationDate ?? ''}
                    onChange={(e) => onChange({ certificationDate: e.target.value || null })}
                    className="h-8 text-xs mt-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="cp-lab" className="text-[11px]">Laboratorio / ente certificatore</Label>
                <Input
                  id="cp-lab"
                  value={certification.certificationLab ?? ''}
                  onChange={(e) => onChange({ certificationLab: e.target.value || null })}
                  placeholder="es. LAPI, IETcc, Giordano, CSI"
                  className="h-8 text-xs mt-1"
                />
              </div>
              <div>
                <Label htmlFor="cp-notes" className="text-[11px]">Note tecniche / link fascicolo</Label>
                <Textarea
                  id="cp-notes"
                  value={certification.certificationNotes ?? ''}
                  onChange={(e) => onChange({ certificationNotes: e.target.value || null })}
                  rows={2}
                  placeholder="es. Fascicolo Knauf W112 completo · DoP n. 0476-CPR-001234..."
                  className="text-xs mt-1"
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* === ACUSTICA === */}
          <AccordionItem value="acoustic">
            <AccordionTrigger className="text-xs font-semibold uppercase tracking-wider text-zinc-700">
              <span className="flex items-center gap-2">
                <Volume2 className="h-3.5 w-3.5 text-blue-600" />
                Prestazioni acustiche
              </span>
            </AccordionTrigger>
            <AccordionContent className="pt-2 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="cp-rw" className="text-[11px]">Rw (dB)</Label>
                  <Input
                    id="cp-rw"
                    type="number"
                    step="0.1"
                    value={certification.acousticPerformance ?? ''}
                    onChange={(e) => onChange({ acousticPerformance: parseNum(e.target.value) })}
                    placeholder="es. 56"
                    className="h-8 text-xs mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="cp-c" className="text-[11px]">C (correttore)</Label>
                  <Input
                    id="cp-c"
                    type="number"
                    step="1"
                    value={certification.acousticRwC ?? ''}
                    onChange={(e) => onChange({ acousticRwC: parseNum(e.target.value) })}
                    placeholder="es. -3"
                    className="h-8 text-xs mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="cp-ctr" className="text-[11px]">Ctr (correttore traffico)</Label>
                  <Input
                    id="cp-ctr"
                    type="number"
                    step="1"
                    value={certification.acousticRwCtr ?? ''}
                    onChange={(e) => onChange({ acousticRwCtr: parseNum(e.target.value) })}
                    placeholder="es. -8"
                    className="h-8 text-xs mt-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="cp-anorm" className="text-[11px]">Norma di prova</Label>
                <Input
                  id="cp-anorm"
                  value={certification.acousticTestNorm ?? ''}
                  onChange={(e) => onChange({ acousticTestNorm: e.target.value || null })}
                  placeholder="es. UNI EN ISO 10140-2 · ISO 717-1"
                  className="h-8 text-xs mt-1"
                />
              </div>
              {certification.acousticPerformance != null && (
                <p className="text-[10px] text-zinc-500 italic">
                  Notazione completa: <span className="font-mono">
                    Rw (C; Ctr) = {certification.acousticPerformance}
                    {certification.acousticRwC != null || certification.acousticRwCtr != null
                      ? ` (${certification.acousticRwC ?? '?'}; ${certification.acousticRwCtr ?? '?'})`
                      : ''} dB
                  </span>
                </p>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* === FUOCO === */}
          <AccordionItem value="fire">
            <AccordionTrigger className="text-xs font-semibold uppercase tracking-wider text-zinc-700">
              <span className="flex items-center gap-2">
                <Flame className="h-3.5 w-3.5 text-orange-600" />
                Resistenza al fuoco
              </span>
            </AccordionTrigger>
            <AccordionContent className="pt-2 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="cp-ei" className="text-[11px]">EI / REI</Label>
                  <Input
                    id="cp-ei"
                    value={certification.fireResistanceClass ?? ''}
                    onChange={(e) => onChange({ fireResistanceClass: e.target.value || null })}
                    placeholder="es. EI 60"
                    className="h-8 text-xs mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="cp-fr" className="text-[11px]">Reazione al fuoco lastre</Label>
                  <Input
                    id="cp-fr"
                    value={certification.fireReactionClass ?? ''}
                    onChange={(e) => onChange({ fireReactionClass: e.target.value || null })}
                    placeholder="es. A2-s1,d0"
                    className="h-8 text-xs mt-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="cp-fnorm" className="text-[11px]">Norma di prova</Label>
                <Input
                  id="cp-fnorm"
                  value={certification.fireTestNorm ?? ''}
                  onChange={(e) => onChange({ fireTestNorm: e.target.value || null })}
                  placeholder="es. EN 1364-1 · EN 13501-2"
                  className="h-8 text-xs mt-1"
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* === TERMICA + MECCANICA + PESO === */}
          <AccordionItem value="thermal-mech">
            <AccordionTrigger className="text-xs font-semibold uppercase tracking-wider text-zinc-700">
              <span className="flex items-center gap-2">
                <Thermometer className="h-3.5 w-3.5 text-emerald-600" />
                Termica · Meccanica · Peso
              </span>
            </AccordionTrigger>
            <AccordionContent className="pt-2 space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="cp-lambda" className="text-[11px]">λ (W/mK)</Label>
                  <Input
                    id="cp-lambda"
                    type="number"
                    step="0.001"
                    value={certification.thermalPerformance ?? ''}
                    onChange={(e) => onChange({ thermalPerformance: parseNum(e.target.value) })}
                    placeholder="0.035"
                    className="h-8 text-xs mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="cp-u" className="text-[11px]">U (W/m²K)</Label>
                  <Input
                    id="cp-u"
                    type="number"
                    step="0.01"
                    value={certification.thermalUValue ?? ''}
                    onChange={(e) => onChange({ thermalUValue: parseNum(e.target.value) })}
                    placeholder="0.45"
                    className="h-8 text-xs mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="cp-r" className="text-[11px]">R (m²K/W)</Label>
                  <Input
                    id="cp-r"
                    type="number"
                    step="0.01"
                    value={certification.thermalRValue ?? ''}
                    onChange={(e) => onChange({ thermalRValue: parseNum(e.target.value) })}
                    placeholder="2.22"
                    className="h-8 text-xs mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-zinc-100">
                <div>
                  <Label htmlFor="cp-weight" className="text-[11px]">Peso (kg/m²)</Label>
                  <Input
                    id="cp-weight"
                    type="number"
                    step="0.1"
                    value={certification.weightPerSqm ?? ''}
                    onChange={(e) => onChange({ weightPerSqm: parseNum(e.target.value) })}
                    placeholder="25.5"
                    className="h-8 text-xs mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="cp-h" className="text-[11px]">H max (m)</Label>
                  <Input
                    id="cp-h"
                    type="number"
                    step="0.1"
                    value={certification.mechanicalMaxHeightM ?? ''}
                    onChange={(e) => onChange({ mechanicalMaxHeightM: parseNum(e.target.value) })}
                    placeholder="4.5"
                    className="h-8 text-xs mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="cp-load" className="text-[11px]">Carico (N/m²)</Label>
                  <Input
                    id="cp-load"
                    type="number"
                    step="10"
                    value={certification.mechanicalLoadNSqm ?? ''}
                    onChange={(e) => onChange({ mechanicalLoadNSqm: parseNum(e.target.value) })}
                    placeholder="500"
                    className="h-8 text-xs mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="cp-susp" className="text-[11px]">Sospendibile (kg/punto)</Label>
                  <Input
                    id="cp-susp"
                    type="number"
                    step="0.5"
                    value={certification.mechanicalSuspendableLoadKg ?? ''}
                    onChange={(e) => onChange({ mechanicalSuspendableLoadKg: parseNum(e.target.value) })}
                    placeholder="30"
                    className="h-8 text-xs mt-1"
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </Card>
  );
};

export default CertificationPanel;

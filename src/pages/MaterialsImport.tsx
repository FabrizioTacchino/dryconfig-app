import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Upload, AlertTriangle, CheckCircle2, FileSpreadsheet } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { parseSaintGobainListino, type ParseResult } from '@/lib/import/saintGobainParser';
import { useImportMaterials, type ImportProgress, type ImportSummary } from '@/hooks/useImportMaterials';
import BackButton from '@/components/layout/BackButton';

interface SupplierOption {
  id: string;
  name: string;
  slug: string;
}

const PARSER_BY_SLUG: Record<string, (buf: ArrayBuffer) => ParseResult> = {
  'saint-gobain': parseSaintGobainListino,
};

const MaterialsImport: React.FC = () => {
  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers-for-import'],
    queryFn: async (): Promise<SupplierOption[]> => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, name, slug')
        .is('organization_id', null)
        .order('name');
      if (error) throw error;
      return data as SupplierOption[];
    },
  });

  const [supplierId, setSupplierId] = useState<string>('');
  const [supplierSlug, setSupplierSlug] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [parsing, setParsing] = useState(false);
  const [archiveMissing, setArchiveMissing] = useState(true);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  const importMutation = useImportMaterials();

  const supplierOptions = useMemo(
    () => suppliers.filter(s => PARSER_BY_SLUG[s.slug]),
    [suppliers],
  );

  const onSelectSupplier = (id: string) => {
    setSupplierId(id);
    const s = suppliers.find(x => x.id === id);
    setSupplierSlug(s?.slug ?? '');
    setFile(null);
    setParseResult(null);
    setSummary(null);
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setParseResult(null);
    setSummary(null);
    if (!f) return;
    if (!supplierSlug || !PARSER_BY_SLUG[supplierSlug]) return;

    setParsing(true);
    try {
      const buf = await f.arrayBuffer();
      const result = PARSER_BY_SLUG[supplierSlug](buf);
      setParseResult(result);
    } finally {
      setParsing(false);
    }
  };

  const handleImport = async () => {
    if (!parseResult || !supplierId) return;
    setSummary(null);
    setProgress({ step: 'resolving_families', processed: 0, total: 0 });
    importMutation.mutate(
      {
        supplier_id: supplierId,
        rows: parseResult.rows,
        archive_missing: archiveMissing,
        onProgress: (p) => setProgress(p),
      },
      {
        onSuccess: (s) => setSummary(s),
      },
    );
  };

  const totalValid = parseResult?.rows.length ?? 0;
  const totalErrors = parseResult?.errors.length ?? 0;

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-4xl">
      <BackButton to="/materials" label="Torna ai materiali" />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Importa listino fornitore</h1>
        <p className="text-muted-foreground text-sm">
          Carica un file Excel di listino: l'app legge tutte le sheet, valida i dati,
          ti mostra un riepilogo, poi su tua conferma aggiorna il catalogo materiali.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>1. Seleziona fornitore e file</CardTitle>
          <CardDescription>
            Per ora abbiamo template di import per: <strong>Saint Gobain</strong>.
            Knauf e Fassa Bortolo arriveranno nei prossimi rilasci.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="supplier">Fornitore</Label>
            <Select value={supplierId} onValueChange={onSelectSupplier}>
              <SelectTrigger id="supplier">
                <SelectValue placeholder="Seleziona un fornitore con template disponibile" />
              </SelectTrigger>
              <SelectContent>
                {supplierOptions.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {supplierId && (
            <div>
              <Label htmlFor="file">File listino (.xlsx)</Label>
              <input
                id="file"
                type="file"
                accept=".xlsx,.xls"
                onChange={onFileChange}
                className="block w-full mt-1 text-sm file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
              {file && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <FileSpreadsheet className="h-3.5 w-3.5" /> {file.name} ({(file.size / 1024).toFixed(0)} KB)
                </p>
              )}
            </div>
          )}

          {parsing && <p className="text-sm text-muted-foreground">Analisi del file in corso…</p>}
        </CardContent>
      </Card>

      {parseResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              2. Anteprima
              <Badge variant="secondary">{totalValid} prodotti validi</Badge>
              {totalErrors > 0 && <Badge variant="destructive">{totalErrors} errori</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Sheet processate</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {parseResult.sheets.map(s => (
                  <div key={s.name} className="rounded-md border p-2 text-xs">
                    <div className="font-medium">{s.name}</div>
                    <div className="text-muted-foreground">
                      {s.valid_rows} validi · {s.skipped_rows} saltati su {s.total_rows} totali
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {parseResult.warnings.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{parseResult.warnings.length} avvisi</AlertTitle>
                <AlertDescription className="text-xs max-h-32 overflow-auto">
                  <ul className="list-disc pl-4 space-y-0.5">
                    {parseResult.warnings.slice(0, 10).map((w, i) => <li key={i}>{w}</li>)}
                    {parseResult.warnings.length > 10 && <li>… e altri {parseResult.warnings.length - 10}</li>}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {parseResult.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{parseResult.errors.length} errori (non importati)</AlertTitle>
                <AlertDescription className="text-xs max-h-32 overflow-auto">
                  <ul className="list-disc pl-4 space-y-0.5">
                    {parseResult.errors.slice(0, 10).map((e, i) => (
                      <li key={i}>{e.sheet} riga {e.row_index + 1}: {e.reason}</li>
                    ))}
                    {parseResult.errors.length > 10 && <li>… e altri {parseResult.errors.length - 10}</li>}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex items-center gap-2">
              <Checkbox
                id="archive"
                checked={archiveMissing}
                onCheckedChange={(v) => setArchiveMissing(!!v)}
              />
              <Label htmlFor="archive" className="font-normal text-sm">
                Archivia (soft-delete) i materiali del fornitore non più presenti nel file
              </Label>
            </div>

            <Button
              size="lg"
              onClick={handleImport}
              disabled={importMutation.isPending || totalValid === 0}
            >
              <Upload className="mr-2 h-4 w-4" />
              {importMutation.isPending ? 'Importazione…' : `Importa ${totalValid} materiali`}
            </Button>
          </CardContent>
        </Card>
      )}

      {progress && progress.step !== 'done' && (
        <Card>
          <CardContent className="pt-6 space-y-2">
            <p className="text-sm font-medium">
              {progress.step === 'resolving_families' && 'Risolvo famiglie prodotti…'}
              {progress.step === 'upserting' && `Importo materiali (${progress.processed}/${progress.total})`}
              {progress.step === 'archiving' && 'Archivio materiali rimossi…'}
            </p>
            <Progress value={progress.total > 0 ? (progress.processed / progress.total) * 100 : 0} />
          </CardContent>
        </Card>
      )}

      {summary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Import completato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Stat label="Nuovi" value={summary.inserted} color="text-green-600" />
              <Stat label="Aggiornati" value={summary.updated} />
              <Stat label="Archiviati" value={summary.archived} color="text-amber-600" />
              <Stat label="Falliti" value={summary.failed} color={summary.failed > 0 ? 'text-destructive' : ''} />
            </div>
            {summary.failures.length > 0 && (
              <Alert variant="destructive">
                <AlertTitle>{summary.failures.length} righe non importate</AlertTitle>
                <AlertDescription className="text-xs max-h-40 overflow-auto">
                  <ul className="list-disc pl-4 space-y-0.5">
                    {summary.failures.slice(0, 20).map((f, i) => (
                      <li key={i}>{f.code}: {f.reason}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const Stat: React.FC<{ label: string; value: number; color?: string }> = ({ label, value, color = '' }) => (
  <div className="rounded-md border p-3">
    <div className={`text-2xl font-bold ${color}`}>{value}</div>
    <div className="text-xs text-muted-foreground">{label}</div>
  </div>
);

export default MaterialsImport;

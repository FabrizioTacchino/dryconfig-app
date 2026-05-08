import React, { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Building2, Globe, Plus, Save, Trash2, ChevronLeft, Percent, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCurrentOrganization } from '@/contexts/OrganizationContext';
import BackButton from '@/components/layout/BackButton';
import {
  useSuppliersList,
  useSupplierFamilies,
  useCreateOrgSupplier,
  useUpsertDiscount,
  useDeleteDiscount,
  type SupplierRow,
  type FamilyRow,
} from '@/hooks/useSupplierManagement';

const Suppliers: React.FC = () => {
  const { currentRole, currentOrganization } = useCurrentOrganization();
  const canManage = currentRole === 'owner' || currentRole === 'admin';
  const canManageDiscounts = canManage; // discount edits limited to owner/admin

  const { data: suppliers = [], isLoading } = useSuppliersList();
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierRow | null>(null);

  if (selectedSupplier) {
    return (
      <SupplierDetail
        supplier={selectedSupplier}
        canManageDiscounts={canManageDiscounts}
        onBack={() => setSelectedSupplier(null)}
      />
    );
  }

  const globals = suppliers.filter(s => s.is_global);
  const owns = suppliers.filter(s => !s.is_global);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <BackButton to="/" label="Torna alla home" />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Fornitori</h1>
        <p className="text-muted-foreground text-sm">
          Gestisci i fornitori e gli sconti riservati per <strong>{currentOrganization?.name ?? 'la tua org'}</strong>.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" /> Fornitori globali ({globals.length})
            </CardTitle>
            <CardDescription>Catalogo comune della piattaforma. Puoi attivare i tuoi sconti riservati.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <SupplierGrid suppliers={globals} onSelect={setSelectedSupplier} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" /> I tuoi fornitori ({owns.length})
            </CardTitle>
            <CardDescription>Fornitori specifici della tua organizzazione.</CardDescription>
          </div>
          {canManage && <CreateSupplierDialog />}
        </CardHeader>
        <CardContent>
          {owns.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nessun fornitore tuo. {canManage ? 'Puoi aggiungerne uno con il pulsante in alto.' : ''}
            </p>
          ) : (
            <SupplierGrid suppliers={owns} onSelect={setSelectedSupplier} />
          )}
        </CardContent>
      </Card>

      {isLoading && <p className="text-sm text-muted-foreground">Caricamento…</p>}
    </div>
  );
};

// ----- Supplier grid -----
const SupplierGrid: React.FC<{ suppliers: SupplierRow[]; onSelect: (s: SupplierRow) => void }> = ({ suppliers, onSelect }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
    {suppliers.map(s => (
      <button
        key={s.id}
        onClick={() => onSelect(s)}
        className="text-left rounded-lg border p-4 hover:border-primary hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="font-semibold">{s.name}</div>
            <div className="text-xs text-muted-foreground">{s.country_code} · {s.is_active ? 'Attivo' : 'Inattivo'}</div>
          </div>
          {s.is_global ? <Badge variant="secondary">Globale</Badge> : <Badge>Tuo</Badge>}
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3 text-center">
          <Stat label="Famiglie" value={s.families_count} />
          <Stat label="Prodotti" value={s.materials_count} />
          <Stat label="Sconti" value={s.discounts_count} highlight={s.discounts_count > 0} />
        </div>
      </button>
    ))}
  </div>
);

const Stat: React.FC<{ label: string; value: number; highlight?: boolean }> = ({ label, value, highlight }) => (
  <div className="rounded-md bg-muted/30 p-2">
    <div className={`text-lg font-bold ${highlight ? 'text-primary' : ''}`}>{value}</div>
    <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</div>
  </div>
);

// ----- Create org supplier dialog -----
const CreateSupplierDialog: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [defaultDiscount, setDefaultDiscount] = useState('');
  const create = useCreateOrgSupplier();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    create.mutate(
      { name, website, contact_email: contactEmail, default_discount: defaultDiscount },
      {
        onSuccess: () => {
          setOpen(false);
          setName(''); setWebsite(''); setContactEmail(''); setDefaultDiscount('');
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="mr-1 h-4 w-4" /> Nuovo fornitore</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuovo fornitore</DialogTitle>
          <DialogDescription>Aggiungi un fornitore specifico per la tua organizzazione.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label htmlFor="s-name">Nome*</Label>
            <Input id="s-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="es. Edilizia Rossi" />
          </div>
          <div>
            <Label htmlFor="s-web">Sito web</Label>
            <Input id="s-web" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <Label htmlFor="s-email">Email contatto</Label>
            <Input id="s-email" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="s-disc">Sconto default</Label>
            <Input id="s-disc" value={defaultDiscount} onChange={(e) => setDefaultDiscount(e.target.value)} placeholder='es. "30+5"' />
            <p className="text-xs text-muted-foreground mt-1">Formato cumulativo, es. "30+5+3" = 30%, poi 5%, poi 3%.</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annulla</Button>
            <Button type="submit" disabled={create.isPending}>{create.isPending ? 'Creo…' : 'Crea'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ----- Supplier detail with families & discounts -----
const SupplierDetail: React.FC<{
  supplier: SupplierRow;
  canManageDiscounts: boolean;
  onBack: () => void;
}> = ({ supplier, canManageDiscounts, onBack }) => {
  const { data: families = [], isLoading } = useSupplierFamilies(supplier.id);

  const summary = useMemo(() => ({
    total: families.length,
    withDiscount: families.filter(f => f.discount_id).length,
    withProducts: families.filter(f => f.materials_count > 0).length,
  }), [families]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Tutti i fornitori
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{supplier.name}</h1>
            <p className="text-muted-foreground text-sm">
              {supplier.is_global ? 'Fornitore globale' : 'Tuo fornitore'} · {summary.total} famiglie ·
              {' '}{summary.withDiscount} con sconto attivo · {summary.withProducts} con prodotti
            </p>
          </div>
        </div>
      </div>

      {!canManageDiscounts && (
        <Alert>
          <AlertDescription>
            Hai accesso in sola lettura. Per modificare gli sconti chiedi al proprietario o admin dell'organizzazione.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" /> Famiglie e sconti riservati
          </CardTitle>
          <CardDescription>
            Gli sconti sono cumulativi: <strong>prezzo netto = listino × (1 − Sconto 1°) × (1 − Sconto 2°)</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Caricamento famiglie…</p>
          ) : families.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nessuna famiglia configurata per questo fornitore.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Codice</TableHead>
                  <TableHead>Famiglia</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Prodotti</TableHead>
                  <TableHead>Sconti cumulativi</TableHead>
                  <TableHead className="text-right">Paghi</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {families.map(f => (
                  <FamilyRow
                    key={f.id}
                    family={f}
                    supplierId={supplier.id}
                    canManage={canManageDiscounts}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// ----- Family row with editable discount chain (N levels) -----
const MAX_LEVELS = 6;

const FamilyRow: React.FC<{
  family: FamilyRow;
  supplierId: string;
  canManage: boolean;
}> = ({ family, supplierId, canManage }) => {
  const upsert = useUpsertDiscount();
  const remove = useDeleteDiscount();

  // Local edit state: array of strings (so empty inputs don't get coerced to 0)
  const [chain, setChain] = useState<string[]>(
    family.discounts.length > 0 ? family.discounts.map(d => String(d)) : ['']
  );

  React.useEffect(() => {
    setChain(family.discounts.length > 0 ? family.discounts.map(d => String(d)) : ['']);
  }, [family.discounts]);

  const numericChain = chain
    .map(s => parseFloat(s))
    .filter(n => Number.isFinite(n) && n > 0 && n < 100);

  const factor = numericChain.reduce((acc, d) => acc * (1 - d / 100), 1);
  const netPct = factor * 100;
  const hasAnyDiscount = numericChain.length > 0;

  const original = family.discounts.map(d => String(d));
  const dirty = JSON.stringify(original) !== JSON.stringify(chain.filter(s => s !== ''));

  const updateLevel = (i: number, v: string) => {
    setChain(prev => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
  };

  const addLevel = () => {
    if (chain.length >= MAX_LEVELS) return;
    setChain(prev => [...prev, '']);
  };

  const removeLevel = (i: number) => {
    setChain(prev => prev.length === 1 ? [''] : prev.filter((_, idx) => idx !== i));
  };

  const handleSave = () => {
    upsert.mutate({
      supplier_id: supplierId,
      family_id: family.id,
      discounts: numericChain,
    });
  };

  const handleClear = () => {
    if (!family.discount_id) return;
    if (!confirm(`Rimuovere tutti gli sconti sulla famiglia "${family.name}"?`)) return;
    remove.mutate(family.discount_id);
  };

  return (
    <TableRow>
      <TableCell><Badge variant="outline" className="font-mono text-xs">{family.code}</Badge></TableCell>
      <TableCell>
        <div className="font-medium text-sm">{family.name}</div>
        {family.brand && <div className="text-xs text-muted-foreground">{family.brand}</div>}
      </TableCell>
      <TableCell><span className="text-xs capitalize">{family.category ?? '—'}</span></TableCell>
      <TableCell className="text-right text-sm">{family.materials_count}</TableCell>
      <TableCell>
        <div className="flex flex-wrap items-center gap-1">
          {chain.map((v, i) => (
            <div key={i} className="flex items-center gap-0.5">
              {i > 0 && <span className="text-xs text-muted-foreground">+</span>}
              <Input
                type="number" step="0.01" min="0" max="100"
                value={v}
                onChange={(e) => updateLevel(i, e.target.value)}
                disabled={!canManage}
                className="w-20 h-8 text-sm"
                placeholder="0"
              />
              {canManage && chain.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeLevel(i)}
                  className="text-muted-foreground hover:text-destructive"
                  title="Rimuovi questo livello"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
          {canManage && chain.length < MAX_LEVELS && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={addLevel}
              title="Aggiungi un altro livello di sconto"
            >
              <Plus className="h-3 w-3" />
            </Button>
          )}
        </div>
      </TableCell>
      <TableCell className="text-right">
        {hasAnyDiscount ? (
          <span className="font-semibold text-primary">{netPct.toFixed(2)}%</span>
        ) : (
          <span className="text-muted-foreground text-sm">listino</span>
        )}
      </TableCell>
      <TableCell>
        <div className="flex gap-1 justify-end">
          {canManage && dirty && (
            <Button size="sm" variant="default" onClick={handleSave} disabled={upsert.isPending}>
              <Save className="h-3.5 w-3.5 mr-1" />Salva
            </Button>
          )}
          {canManage && family.discount_id && !dirty && (
            <Button size="sm" variant="ghost" onClick={handleClear} disabled={remove.isPending} title="Rimuovi sconto">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};

export default Suppliers;

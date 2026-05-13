import React, { useMemo, useState } from 'react';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Pencil, Trash2, Building, User, Search } from 'lucide-react';
import {
  useCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer,
  type Customer, type CustomerType,
} from '@/hooks/useCustomers';
import { useCurrentOrganization } from '@/contexts/OrganizationContext';
import BackButton from '@/components/layout/BackButton';

interface EditableCustomerForm {
  id?: string;
  name: string;
  type: CustomerType;
  vat_number: string;
  fiscal_code: string;
  address_line: string;
  city: string;
  zip_code: string;
  province: string;
  phone: string;
  email: string;
  pec: string;
  sdi_code: string;
  notes: string;
}

const emptyForm: EditableCustomerForm = {
  name: '', type: 'individual',
  vat_number: '', fiscal_code: '',
  address_line: '', city: '', zip_code: '', province: '',
  phone: '', email: '', pec: '', sdi_code: '',
  notes: '',
};

function customerToForm(c: Customer): EditableCustomerForm {
  return {
    id: c.id,
    name: c.name ?? '',
    type: c.type,
    vat_number: c.vat_number ?? '',
    fiscal_code: c.fiscal_code ?? '',
    address_line: c.address_line ?? '',
    city: c.city ?? '',
    zip_code: c.zip_code ?? '',
    province: c.province ?? '',
    phone: c.phone ?? '',
    email: c.email ?? '',
    pec: c.pec ?? '',
    sdi_code: c.sdi_code ?? '',
    notes: c.notes ?? '',
  };
}

/**
 * Anagrafica clienti dell'organizzazione (F24).
 * - Lista con search
 * - Dialog crea/modifica
 * - Persona fisica (codice fiscale) vs Azienda (P.IVA + SDI/PEC)
 * - Eliminazione con conferma
 */
const Customers: React.FC = () => {
  const { currentRole, currentOrganization } = useCurrentOrganization();
  const canManage = ['owner', 'admin', 'supervisor', 'technician'].includes(currentRole ?? '');
  const canDelete = ['owner', 'admin', 'supervisor'].includes(currentRole ?? '');

  const { data: customers = [], isLoading } = useCustomers();
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();

  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<EditableCustomerForm>(emptyForm);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(c =>
      [c.name, c.vat_number, c.fiscal_code, c.city, c.email, c.phone]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [customers, searchQuery]);

  const openNew = () => {
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (c: Customer) => {
    setForm(customerToForm(c));
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    const payload = {
      name: form.name.trim(),
      type: form.type,
      vat_number: form.vat_number.trim(),
      fiscal_code: form.fiscal_code.trim().toUpperCase(),
      address_line: form.address_line.trim(),
      city: form.city.trim(),
      zip_code: form.zip_code.trim(),
      province: form.province.trim().toUpperCase().slice(0, 2),
      phone: form.phone.trim(),
      email: form.email.trim(),
      pec: form.pec.trim(),
      sdi_code: form.sdi_code.trim().toUpperCase(),
      notes: form.notes.trim(),
    };
    if (form.id) {
      updateCustomer.mutate({ id: form.id, ...payload }, {
        onSuccess: () => setDialogOpen(false),
      });
    } else {
      createCustomer.mutate(payload, {
        onSuccess: () => setDialogOpen(false),
      });
    }
  };

  const handleDelete = (c: Customer) => {
    if (!confirm(`Eliminare il cliente "${c.name}"?\n\nI progetti associati resteranno ma senza riferimento al cliente.`)) return;
    deleteCustomer.mutate(c.id);
  };

  if (!currentOrganization) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-muted-foreground">Nessuna organizzazione attiva.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <BackButton />
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Clienti</h1>
            <p className="text-muted-foreground text-sm">
              Anagrafica clienti dell'organizzazione. Associabili ai progetti per intestazione
              automatica dei preventivi.
            </p>
          </div>
        </div>
        {canManage && (
          <Button onClick={openNew}>
            <Plus className="h-4 w-4 mr-2" />
            Nuovo cliente
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Lista ({filtered.length})</span>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca per nome, P.IVA, città…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Caricamento…</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm mb-3">
                {customers.length === 0 ? 'Nessun cliente in anagrafica.' : 'Nessun cliente corrisponde alla ricerca.'}
              </p>
              {canManage && customers.length === 0 && (
                <Button onClick={openNew} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Crea il primo cliente
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Nome / Ragione sociale</TableHead>
                  <TableHead>P.IVA / CF</TableHead>
                  <TableHead>Città</TableHead>
                  <TableHead>Contatti</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(c => (
                  <TableRow key={c.id}>
                    <TableCell>
                      {c.type === 'company' ? (
                        <Badge variant="secondary" className="gap-1">
                          <Building className="h-3 w-3" />
                          Azienda
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1">
                          <User className="h-3 w-3" />
                          Privato
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {c.vat_number || c.fiscal_code || '—'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {c.city ? `${c.city}${c.province ? ` (${c.province})` : ''}` : '—'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {[c.email, c.phone].filter(Boolean).join(' · ') || '—'}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      {canManage && (
                        <Button variant="ghost" size="icon" onClick={() => openEdit(c)} title="Modifica">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(c)} title="Elimina">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Modifica cliente' : 'Nuovo cliente'}</DialogTitle>
            <DialogDescription>
              {form.type === 'company'
                ? 'Azienda: usa P.IVA e codice SDI per fatturazione elettronica.'
                : 'Persona fisica: usa codice fiscale per fatturazione.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cu-type">Tipo</Label>
                <select
                  id="cu-type"
                  value={form.type}
                  onChange={(e) => setForm(f => ({ ...f, type: e.target.value as CustomerType }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="individual">Persona fisica</option>
                  <option value="company">Azienda / Studio</option>
                </select>
              </div>
              <div>
                <Label htmlFor="cu-name">{form.type === 'company' ? 'Ragione sociale *' : 'Nome e cognome *'}</Label>
                <Input
                  id="cu-name"
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              {form.type === 'company' ? (
                <>
                  <div>
                    <Label htmlFor="cu-vat">Partita IVA</Label>
                    <Input
                      id="cu-vat"
                      value={form.vat_number}
                      onChange={(e) => setForm(f => ({ ...f, vat_number: e.target.value }))}
                      placeholder="IT12345678901"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cu-sdi">Codice SDI</Label>
                    <Input
                      id="cu-sdi"
                      value={form.sdi_code}
                      onChange={(e) => setForm(f => ({ ...f, sdi_code: e.target.value }))}
                      placeholder="0000000"
                      maxLength={7}
                    />
                  </div>
                </>
              ) : (
                <div className="md:col-span-2">
                  <Label htmlFor="cu-cf">Codice Fiscale</Label>
                  <Input
                    id="cu-cf"
                    value={form.fiscal_code}
                    onChange={(e) => setForm(f => ({ ...f, fiscal_code: e.target.value }))}
                    placeholder="RSSMRA80A01F205X"
                    maxLength={16}
                  />
                </div>
              )}
              <div className="md:col-span-2">
                <Label htmlFor="cu-addr">Indirizzo</Label>
                <Input
                  id="cu-addr"
                  value={form.address_line}
                  onChange={(e) => setForm(f => ({ ...f, address_line: e.target.value }))}
                  placeholder="Via Roma 12"
                />
              </div>
              <div>
                <Label htmlFor="cu-zip">CAP</Label>
                <Input
                  id="cu-zip"
                  value={form.zip_code}
                  onChange={(e) => setForm(f => ({ ...f, zip_code: e.target.value }))}
                  placeholder="20121"
                />
              </div>
              <div>
                <Label htmlFor="cu-city">Città</Label>
                <Input
                  id="cu-city"
                  value={form.city}
                  onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))}
                  placeholder="Milano"
                />
              </div>
              <div>
                <Label htmlFor="cu-prov">Provincia</Label>
                <Input
                  id="cu-prov"
                  value={form.province}
                  onChange={(e) => setForm(f => ({ ...f, province: e.target.value }))}
                  placeholder="MI"
                  maxLength={2}
                />
              </div>
              <div>
                <Label htmlFor="cu-phone">Telefono</Label>
                <Input
                  id="cu-phone"
                  value={form.phone}
                  onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+39 02 1234567"
                />
              </div>
              <div>
                <Label htmlFor="cu-email">Email</Label>
                <Input
                  id="cu-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="info@cliente.it"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="cu-pec">PEC</Label>
                <Input
                  id="cu-pec"
                  value={form.pec}
                  onChange={(e) => setForm(f => ({ ...f, pec: e.target.value }))}
                  placeholder="cliente@pec.it"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="cu-notes">Note</Label>
                <Textarea
                  id="cu-notes"
                  value={form.notes}
                  onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annulla</Button>
            <Button onClick={handleSubmit} disabled={createCustomer.isPending || updateCustomer.isPending}>
              {form.id ? 'Salva modifiche' : 'Crea cliente'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Customers;

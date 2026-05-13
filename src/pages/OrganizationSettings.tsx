import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Trash2, Image as ImageIcon, Save, Building2 } from 'lucide-react';
import {
  useOrgProfile,
  useUpdateOrgProfile,
  useUploadOrgLogo,
  useRemoveOrgLogo,
} from '@/hooks/useOrgSettings';
import { useCurrentOrganization } from '@/contexts/OrganizationContext';
import BackButton from '@/components/layout/BackButton';
import { toast } from 'sonner';

/**
 * Settings → Organizzazione. Solo owner/admin può modificare.
 * Contiene:
 *  - Logo (upload + preview, max 2MB, PNG/JPG/SVG/WebP)
 *  - Anagrafica: ragione sociale completa, P.IVA, indirizzo, contatti
 *
 * Tutto finisce in `organizations.settings` JSONB (+ name + vat_number su colonne).
 * I dati vengono usati in copertina e header del PDF RDA (F22).
 */
const OrganizationSettings: React.FC = () => {
  const { currentRole, currentOrganization } = useCurrentOrganization();
  const canManage = currentRole === 'owner' || currentRole === 'admin';

  const { data: profile, isLoading } = useOrgProfile();
  const updateProfile = useUpdateOrgProfile();
  const uploadLogo = useUploadOrgLogo();
  const removeLogo = useRemoveOrgLogo();

  // Form state locale (controlled) — più semplice che react-hook-form qui.
  const [form, setForm] = useState({
    name: '',
    vat_number: '',
    company_name: '',
    address_line: '',
    city: '',
    zip_code: '',
    province: '',
    phone: '',
    email: '',
    website: '',
  });

  useEffect(() => {
    if (!profile) return;
    setForm({
      name: profile.name ?? '',
      vat_number: profile.vat_number ?? '',
      company_name: profile.company_name ?? '',
      address_line: profile.address_line ?? '',
      city: profile.city ?? '',
      zip_code: profile.zip_code ?? '',
      province: profile.province ?? '',
      phone: profile.phone ?? '',
      email: profile.email ?? '',
      website: profile.website ?? '',
    });
  }, [profile]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadLogo.mutate(file, {
      onSettled: () => {
        // Reset input così l'utente può ri-uploadare lo stesso file
        e.target.value = '';
      },
    });
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error('Il nome organizzazione è obbligatorio');
      return;
    }
    updateProfile.mutate({
      name: form.name.trim(),
      vat_number: form.vat_number.trim() || null,
      company_name: form.company_name.trim(),
      address_line: form.address_line.trim(),
      city: form.city.trim(),
      zip_code: form.zip_code.trim(),
      province: form.province.trim().toUpperCase().slice(0, 2),
      phone: form.phone.trim(),
      email: form.email.trim(),
      website: form.website.trim(),
    });
  };

  if (!currentOrganization) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-muted-foreground">Nessuna organizzazione attiva.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-3xl">
      <BackButton />
      <div className="flex items-center gap-3">
        <Building2 className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Anagrafica organizzazione</h1>
          <p className="text-muted-foreground text-sm">
            Logo e dati anagrafici dell'azienda. Usati su copertina e header dei PDF (RDA, scheda
            tecnica) e per identificare la tua organizzazione.
          </p>
        </div>
      </div>

      {!canManage && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <p className="text-sm">
              Sei in modalità sola lettura. Solo i ruoli <strong>owner</strong> e{' '}
              <strong>admin</strong> possono modificare l'anagrafica.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Logo */}
      <Card>
        <CardHeader>
          <CardTitle>Logo aziendale</CardTitle>
          <CardDescription>
            PNG, JPG, SVG o WebP — max 2MB. Idealmente con sfondo trasparente, formato quadrato o
            rettangolare 3:1. Verrà ridimensionato automaticamente nel PDF.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile?.logo_url ? (
            <div className="flex items-center gap-4">
              <div className="border rounded p-2 bg-muted/30 w-32 h-32 flex items-center justify-center">
                <img
                  src={profile.logo_url}
                  alt="Logo organizzazione"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              {canManage && (
                <div className="flex flex-col gap-2">
                  <label htmlFor="logo-replace" className="cursor-pointer">
                    <input
                      id="logo-replace"
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml,image/webp"
                      className="hidden"
                      onChange={handleFile}
                      disabled={uploadLogo.isPending}
                    />
                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium border bg-background hover:bg-accent ${uploadLogo.isPending ? 'opacity-50 pointer-events-none' : ''}`}>
                      <Upload className="h-4 w-4" />
                      {uploadLogo.isPending ? 'Caricamento...' : 'Sostituisci logo'}
                    </span>
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm('Rimuovere il logo aziendale?')) removeLogo.mutate();
                    }}
                    disabled={removeLogo.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Rimuovi
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center">
              <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground mb-4">Nessun logo caricato</p>
              {canManage && (
                <label htmlFor="logo-upload" className="cursor-pointer">
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    className="hidden"
                    onChange={handleFile}
                    disabled={uploadLogo.isPending}
                  />
                  <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 ${uploadLogo.isPending ? 'opacity-50 pointer-events-none' : ''}`}>
                    <Upload className="h-4 w-4" />
                    {uploadLogo.isPending ? 'Caricamento...' : 'Carica logo'}
                  </span>
                </label>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Anagrafica */}
      <Card>
        <CardHeader>
          <CardTitle>Dati aziendali</CardTitle>
          <CardDescription>
            Questi dati appaiono in intestazione su tutti i documenti PDF generati dall'app
            (preventivi, RDA, schede tecniche).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nome organizzazione *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Es. Impresa B4T"
                disabled={!canManage || isLoading}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Nome breve mostrato nell'header dell'app
              </p>
            </div>
            <div>
              <Label htmlFor="company_name">Ragione sociale completa</Label>
              <Input
                id="company_name"
                value={form.company_name}
                onChange={(e) => setForm(f => ({ ...f, company_name: e.target.value }))}
                placeholder="Es. Impresa B4T S.r.l."
                disabled={!canManage || isLoading}
              />
              <p className="text-xs text-muted-foreground mt-1">Usata nell'intestazione PDF</p>
            </div>
            <div>
              <Label htmlFor="vat_number">Partita IVA</Label>
              <Input
                id="vat_number"
                value={form.vat_number}
                onChange={(e) => setForm(f => ({ ...f, vat_number: e.target.value }))}
                placeholder="IT12345678901"
                disabled={!canManage || isLoading}
              />
            </div>
            <div>
              <Label htmlFor="phone">Telefono</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+39 02 1234567"
                disabled={!canManage || isLoading}
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="address_line">Indirizzo</Label>
              <Input
                id="address_line"
                value={form.address_line}
                onChange={(e) => setForm(f => ({ ...f, address_line: e.target.value }))}
                placeholder="Via Roma 12"
                disabled={!canManage || isLoading}
              />
            </div>
            <div>
              <Label htmlFor="zip_code">CAP</Label>
              <Input
                id="zip_code"
                value={form.zip_code}
                onChange={(e) => setForm(f => ({ ...f, zip_code: e.target.value }))}
                placeholder="20121"
                disabled={!canManage || isLoading}
              />
            </div>
            <div>
              <Label htmlFor="city">Città</Label>
              <Input
                id="city"
                value={form.city}
                onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))}
                placeholder="Milano"
                disabled={!canManage || isLoading}
              />
            </div>
            <div>
              <Label htmlFor="province">Provincia</Label>
              <Input
                id="province"
                value={form.province}
                onChange={(e) => setForm(f => ({ ...f, province: e.target.value }))}
                placeholder="MI"
                maxLength={2}
                disabled={!canManage || isLoading}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="info@impresa.it"
                disabled={!canManage || isLoading}
              />
            </div>
            <div>
              <Label htmlFor="website">Sito web</Label>
              <Input
                id="website"
                value={form.website}
                onChange={(e) => setForm(f => ({ ...f, website: e.target.value }))}
                placeholder="https://www.impresa.it"
                disabled={!canManage || isLoading}
              />
            </div>
          </div>
          {canManage && (
            <div className="flex justify-end pt-2">
              <Button onClick={handleSave} disabled={updateProfile.isPending || isLoading}>
                <Save className="h-4 w-4 mr-2" />
                {updateProfile.isPending ? 'Salvataggio...' : 'Salva modifiche'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OrganizationSettings;

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Trash2, Image as ImageIcon, Save, Building2, Calculator, FileText, Hash } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import {
  useOrgProfile,
  useUpdateOrgProfile,
  useUploadOrgLogo,
  useRemoveOrgLogo,
  PRICING_DEFAULTS,
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

  // Form state locale (controlled) — campi numerici come stringa per gestire ""/0.
  const [form, setForm] = useState({
    // Anagrafica
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
    // Pricing (stringhe per input numerici)
    markup_materials_pct: '',
    markup_labor_pct: '',
    markup_finish_pct: '',
    overhead_pct: '',
    safety_pct: '',
    transport_flat: '',
    disposal_flat: '',
    default_customer_discount_pct: '',
    // IVA & validità
    iva_pct: '',
    offer_validity_days: '',
    payment_advance_pct: '',
    payment_mid_pct: '',
    payment_balance_pct: '',
    delivery_terms: '',
    warranty_terms: '',
    terms_text: '',
    // Numerazione
    offer_number_prefix: '',
    offer_number_format: 'YEAR_SLASH' as 'YEAR_SLASH' | 'YEAR_DASH',
  });

  useEffect(() => {
    if (!profile) return;
    const numOrEmpty = (v: unknown): string =>
      typeof v === 'number' && Number.isFinite(v) ? String(v) : '';
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
      markup_materials_pct: numOrEmpty(profile.markup_materials_pct),
      markup_labor_pct: numOrEmpty(profile.markup_labor_pct),
      markup_finish_pct: numOrEmpty(profile.markup_finish_pct),
      overhead_pct: numOrEmpty(profile.overhead_pct),
      safety_pct: numOrEmpty(profile.safety_pct),
      transport_flat: numOrEmpty(profile.transport_flat),
      disposal_flat: numOrEmpty(profile.disposal_flat),
      default_customer_discount_pct: numOrEmpty(profile.default_customer_discount_pct),
      iva_pct: numOrEmpty(profile.iva_pct),
      offer_validity_days: numOrEmpty(profile.offer_validity_days),
      payment_advance_pct: numOrEmpty(profile.payment_advance_pct),
      payment_mid_pct: numOrEmpty(profile.payment_mid_pct),
      payment_balance_pct: numOrEmpty(profile.payment_balance_pct),
      delivery_terms: profile.delivery_terms ?? '',
      warranty_terms: profile.warranty_terms ?? '',
      terms_text: profile.terms_text ?? '',
      offer_number_prefix: profile.offer_number_prefix ?? '',
      offer_number_format: profile.offer_number_format ?? 'YEAR_SLASH',
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
    // Converte stringa → numero. "" diventa undefined (mantiene il default).
    const parseNum = (s: string): number | undefined => {
      if (!s.trim()) return undefined;
      const n = Number(s.replace(',', '.'));
      return Number.isFinite(n) ? n : undefined;
    };
    updateProfile.mutate({
      // Anagrafica
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
      // Pricing
      markup_materials_pct: parseNum(form.markup_materials_pct),
      markup_labor_pct: parseNum(form.markup_labor_pct),
      markup_finish_pct: parseNum(form.markup_finish_pct),
      overhead_pct: parseNum(form.overhead_pct),
      safety_pct: parseNum(form.safety_pct),
      transport_flat: parseNum(form.transport_flat),
      disposal_flat: parseNum(form.disposal_flat),
      default_customer_discount_pct: parseNum(form.default_customer_discount_pct),
      // IVA & validità
      iva_pct: parseNum(form.iva_pct),
      offer_validity_days: parseNum(form.offer_validity_days),
      payment_advance_pct: parseNum(form.payment_advance_pct),
      payment_mid_pct: parseNum(form.payment_mid_pct),
      payment_balance_pct: parseNum(form.payment_balance_pct),
      delivery_terms: form.delivery_terms.trim(),
      warranty_terms: form.warranty_terms.trim(),
      terms_text: form.terms_text.trim(),
      // Numerazione
      offer_number_prefix: form.offer_number_prefix.trim(),
      offer_number_format: form.offer_number_format,
    });
  };

  // Helper to render numeric inputs with placeholder = default
  const numField = (
    key: keyof typeof form,
    label: string,
    placeholder: string,
    hint?: string,
    suffix?: string,
  ) => (
    <div>
      <Label htmlFor={key}>{label}</Label>
      <div className="relative">
        <Input
          id={key}
          type="number"
          step="0.1"
          value={form[key] as string}
          onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
          placeholder={placeholder}
          disabled={!canManage || isLoading}
          className={suffix ? 'pr-10' : ''}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  );

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
        </CardContent>
      </Card>

      {/* === Pricing & Mark-up (F23) === */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Listino vendita: mark-up e costi accessori
          </CardTitle>
          <CardDescription>
            Trasforma il prezzo di costo in prezzo di vendita al cliente. Il preventivo mostra
            il <strong>prezzo netto al cliente</strong>; il margine resta interno (visibile solo
            a owner/admin nella vista preventivo).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-medium text-sm mb-3">Mark-up sui costi diretti</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {numField('markup_materials_pct', 'Mark-up materiali', String(PRICING_DEFAULTS.markup_materials_pct), 'Margine sul costo dei materiali (lastre, viti, ecc.)', '%')}
              {numField('markup_labor_pct', 'Mark-up manodopera', String(PRICING_DEFAULTS.markup_labor_pct), 'Più alto perché copre la struttura aziendale', '%')}
              {numField('markup_finish_pct', 'Mark-up finitura', String(PRICING_DEFAULTS.markup_finish_pct), 'Margine sulla finitura Q1-Q4', '%')}
            </div>
          </div>
          <div>
            <h3 className="font-medium text-sm mb-3">Costi accessori</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {numField('overhead_pct', 'Spese generali', String(PRICING_DEFAULTS.overhead_pct), 'Ammortamenti, uffici, software, assicurazioni', '%')}
              {numField('safety_pct', 'Sicurezza / DPI / Ponteggi', String(PRICING_DEFAULTS.safety_pct), 'Misure di sicurezza cantiere', '%')}
              {numField('transport_flat', 'Trasporto materiali', '0', 'Forfait per consegna in cantiere', '€')}
              {numField('disposal_flat', 'Smaltimento rifiuti', '0', 'Forfait per scarti / cartoni / plastica', '€')}
            </div>
          </div>
          <div>
            <h3 className="font-medium text-sm mb-3">Sconto cliente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {numField('default_customer_discount_pct', 'Sconto cliente default', '0', 'Sconto commerciale standard applicato sul totale lordo (override per singolo preventivo in futuro)', '%')}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* === IVA, Validità, Pagamenti (F27) === */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            IVA, validità offerta, pagamenti
          </CardTitle>
          <CardDescription>
            Termini commerciali standard inseriti automaticamente nel PDF del preventivo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {numField('iva_pct', 'IVA', String(PRICING_DEFAULTS.iva_pct), '22% standard, 10% ristrutturazioni in detrazione', '%')}
            {numField('offer_validity_days', 'Validità offerta', String(PRICING_DEFAULTS.offer_validity_days), 'Giorni dalla data di emissione', 'gg')}
          </div>
          <div>
            <h3 className="font-medium text-sm mb-3">Modalità di pagamento (in %)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {numField('payment_advance_pct', 'Acconto all\'ordine', String(PRICING_DEFAULTS.payment_advance_pct), '', '%')}
              {numField('payment_mid_pct', 'A metà lavori', String(PRICING_DEFAULTS.payment_mid_pct), '', '%')}
              {numField('payment_balance_pct', 'Saldo a fine lavori', String(PRICING_DEFAULTS.payment_balance_pct), '', '%')}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              La somma dovrebbe fare 100%. Mostrato nel PDF come scaletta di pagamenti.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="delivery_terms">Termini di consegna</Label>
              <Input
                id="delivery_terms"
                value={form.delivery_terms}
                onChange={(e) => setForm(f => ({ ...f, delivery_terms: e.target.value }))}
                placeholder="Es. 30 giorni lavorativi dall'ordine"
                disabled={!canManage || isLoading}
              />
            </div>
            <div>
              <Label htmlFor="warranty_terms">Garanzia</Label>
              <Input
                id="warranty_terms"
                value={form.warranty_terms}
                onChange={(e) => setForm(f => ({ ...f, warranty_terms: e.target.value }))}
                placeholder="Es. 5 anni sulla posa"
                disabled={!canManage || isLoading}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="terms_text">Note legali / Termini & condizioni (PDF)</Label>
            <Textarea
              id="terms_text"
              value={form.terms_text}
              onChange={(e) => setForm(f => ({ ...f, terms_text: e.target.value }))}
              placeholder="Testo libero che apparirà in coda al PDF (clausole, condizioni di pagamento, foro competente...)"
              rows={4}
              disabled={!canManage || isLoading}
            />
          </div>
        </CardContent>
      </Card>

      {/* === Numerazione offerte (F25) === */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5 text-primary" />
            Numerazione preventivi
          </CardTitle>
          <CardDescription>
            Numero progressivo automatico assegnato alla prima stampa del preventivo. Resta fisso
            dopo essere stato emesso.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="offer_number_prefix">Prefisso</Label>
              <Input
                id="offer_number_prefix"
                value={form.offer_number_prefix}
                onChange={(e) => setForm(f => ({ ...f, offer_number_prefix: e.target.value }))}
                placeholder={PRICING_DEFAULTS.offer_number_prefix}
                disabled={!canManage || isLoading}
              />
              <p className="text-xs text-muted-foreground mt-1">Es. "OFF", "PRE", iniziali azienda</p>
            </div>
            <div>
              <Label htmlFor="offer_number_format">Formato</Label>
              <select
                id="offer_number_format"
                value={form.offer_number_format}
                onChange={(e) => setForm(f => ({ ...f, offer_number_format: e.target.value as 'YEAR_SLASH' | 'YEAR_DASH' }))}
                disabled={!canManage || isLoading}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="YEAR_SLASH">2026/001 (con slash)</option>
                <option value="YEAR_DASH">2026-001 (con trattino)</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Anteprima: <strong>{(form.offer_number_prefix || 'OFF')}-{new Date().getFullYear()}{form.offer_number_format === 'YEAR_DASH' ? '-' : '/'}001</strong>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bottone Salva globale */}
      {canManage && (
        <div className="flex justify-end pb-12 sticky bottom-4 bg-background/80 backdrop-blur-sm border rounded-lg p-3 shadow-sm">
          <Button onClick={handleSave} disabled={updateProfile.isPending || isLoading} size="lg">
            <Save className="h-4 w-4 mr-2" />
            {updateProfile.isPending ? 'Salvataggio...' : 'Salva tutte le impostazioni'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default OrganizationSettings;

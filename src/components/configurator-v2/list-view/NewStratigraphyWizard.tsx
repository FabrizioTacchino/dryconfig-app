import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Search, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';

interface NewStratigraphyWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Se valorizzato, viene propagato in tutti i navigate. */
  estimateId?: string | null;
}

/**
 * Wizard 3-vie d'ingresso al configuratore V2.
 *
 * Quando l'utente clicca "+ Nuova stratigrafia" appare questa scelta:
 *  1. Cerca esistente   → torna alla lista con i filtri
 *  2. Da catalogo certificato → lista con showCertifiedOnly attivo
 *  3. Crea da zero      → builder vuoto in modalità custom
 *
 * In una fase futura (0.4) la card "Da catalogo certificato" potrà aprire
 * direttamente il form di inserimento di una stratigrafia certificata
 * con tutti i campi normativi.
 */
const NewStratigraphyWizard: React.FC<NewStratigraphyWizardProps> = ({
  open,
  onOpenChange,
  estimateId,
}) => {
  const navigate = useNavigate();

  const buildParams = (extra: Record<string, string> = {}) => {
    const params = new URLSearchParams();
    if (estimateId) params.set('estimate', estimateId);
    for (const [k, v] of Object.entries(extra)) params.set(k, v);
    return params.toString();
  };

  const goSearch = () => {
    onOpenChange(false);
    // Resta sulla lista, niente filtro speciale
    const qs = buildParams();
    navigate(qs ? `/configurator?${qs}` : '/configurator');
  };

  const goCertified = () => {
    onOpenChange(false);
    // Lista con flag certificate-only attivo (lo gestisce StratigraphyListV2)
    const qs = buildParams({ filter: 'certified' });
    navigate(`/configurator?${qs}`);
  };

  const goCustom = () => {
    onOpenChange(false);
    const qs = buildParams({ new: 'true' });
    navigate(`/configurator?${qs}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Nuova stratigrafia</DialogTitle>
          <DialogDescription>
            Come vuoi iniziare?
            {estimateId && (
              <span className="ml-1 text-blue-700">La stratigrafia verrà aggiunta al preventivo corrente.</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
          <WizardCard
            icon={<Search className="h-5 w-5 text-zinc-700" />}
            title="Cerca esistente"
            description="Sfoglia tutte le stratigrafie già salvate dalla tua organizzazione e duplicale o usale come base."
            cta="Apri ricerca"
            onClick={goSearch}
            tone="zinc"
          />
          <WizardCard
            icon={<ShieldCheck className="h-5 w-5 text-blue-700" />}
            title="Da catalogo certificato"
            description="Scegli da una libreria di stratigrafie certificate dei produttori (Knauf W11x, Gyproc, Siniat…)."
            cta="Apri catalogo"
            onClick={goCertified}
            tone="blue"
            featured
          />
          <WizardCard
            icon={<Sparkles className="h-5 w-5 text-amber-700" />}
            title="Crea da zero"
            description="Configura la tua stratigrafia personalizzata con i materiali del catalogo della tua organizzazione."
            cta="Builder libero"
            onClick={goCustom}
            tone="amber"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

const WizardCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  cta: string;
  onClick: () => void;
  tone: 'zinc' | 'blue' | 'amber';
  featured?: boolean;
}> = ({ icon, title, description, cta, onClick, tone, featured }) => {
  const toneClasses: Record<typeof tone, string> = {
    zinc: 'border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50/60',
    blue: 'border-blue-200 hover:border-blue-500 hover:bg-blue-50/60',
    amber: 'border-amber-200 hover:border-amber-500 hover:bg-amber-50/60',
  };
  const featuredClass = featured
    ? ' ring-2 ring-blue-200 ring-offset-1'
    : '';
  const ctaTone: Record<typeof tone, string> = {
    zinc: 'text-zinc-700',
    blue: 'text-blue-700',
    amber: 'text-amber-700',
  };
  return (
    <button
      onClick={onClick}
      className={`group flex flex-col text-left p-4 rounded-lg border-2 transition-all ${toneClasses[tone]}${featuredClass}`}
    >
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h3 className="text-base font-semibold text-zinc-900">{title}</h3>
        {featured && (
          <span className="ml-auto text-[9px] uppercase tracking-wider text-blue-700 font-bold">
            Consigliato
          </span>
        )}
      </div>
      <p className="text-xs text-zinc-600 mb-3 leading-relaxed flex-1">{description}</p>
      <span className={`text-xs font-medium flex items-center gap-1 ${ctaTone[tone]}`}>
        {cta}
        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
      </span>
    </button>
  );
};

export default NewStratigraphyWizard;


import React, { useEffect, useState } from "react";
import { useConfiguratorSettings } from "@/hooks/useConfiguratorSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useScrewSettings, ScrewQuantitySetting, ScrewPreferenceRule } from "@/hooks/useScrewSettings";

type ScrewConfig = {
  id: string;
  plates_count: number;
  screw_length: number;
  screw_code: string;
  compatible_board_types: string[];
  margin: number;
  notes?: string;
};

const ScrewSettings = () => {
  const { getScrewConfigs, addScrewConfig, removeScrewConfig } = useConfiguratorSettings();
  const [list, setList] = useState<ScrewConfig[]>([]);
  const [form, setForm] = useState<Omit<ScrewConfig, "id">>({
    plates_count: 1,
    screw_length: 25,
    screw_code: "",
    compatible_board_types: [],
    margin: 10,
    notes: "",
  });
  const [loading, setLoading] = useState(true);

  // SEZIONI custom per quantità e preferenze
  const {
    getScrewQuantitySettings,
    upsertScrewQuantitySetting,
    deleteScrewQuantitySetting,
    getScrewPreferenceRules,
    upsertScrewPreferenceRule,
    deleteScrewPreferenceRule,
  } = useScrewSettings();

  // Stato - Quantità
  const [quantityRows, setQuantityRows] = useState<ScrewQuantitySetting[]>([]);
  const [quantityForm, setQuantityForm] = useState<Omit<ScrewQuantitySetting, "id">>({
    position_in_block: 1,
    quantity_per_sqm: 6,
    description: ""
  });

  // Stato - Preferenze
  const [preferenceRules, setPreferenceRules] = useState<ScrewPreferenceRule[]>([]);
  const [prefForm, setPrefForm] = useState<Omit<ScrewPreferenceRule, "id">>({
    min_length_mm: 22, max_length_mm: null, preferred_order: [], description: ""
  });

  // Load settings
  useEffect(() => {
    getScrewConfigs().then(confs => {
      setList(confs);
      setLoading(false);
    });
    // Quantità
    getScrewQuantitySettings().then(data => setQuantityRows(data as ScrewQuantitySetting[]));
    // Preferenze
    getScrewPreferenceRules().then(data => setPreferenceRules(data as ScrewPreferenceRule[]));
  }, [getScrewConfigs, getScrewQuantitySettings, getScrewPreferenceRules]);

  // CRUD quantità
  const handleAddQuantity = async () => {
    await upsertScrewQuantitySetting(quantityForm);
    setQuantityForm({ position_in_block: 1, quantity_per_sqm: 6, description: "" });
    toast.success("Regola quantità salvata!");
    setQuantityRows(await getScrewQuantitySettings() as ScrewQuantitySetting[]);
  };
  const handleRemoveQuantity = async (id: string) => {
    await deleteScrewQuantitySetting(id);
    toast.success("Regola rimossa.");
    setQuantityRows(await getScrewQuantitySettings() as ScrewQuantitySetting[]);
  };

  // CRUD preferenze
  const handleAddPref = async () => {
    await upsertScrewPreferenceRule({ ...prefForm, preferred_order: prefForm.preferred_order.filter(Boolean) });
    setPrefForm({ min_length_mm: 22, max_length_mm: null, preferred_order: [], description: "" });
    toast.success("Preferenza salvata!");
    setPreferenceRules(await getScrewPreferenceRules() as ScrewPreferenceRule[]);
  };
  const handleRemovePref = async (id: string) => {
    await deleteScrewPreferenceRule(id);
    toast.success("Preferenza rimossa.");
    setPreferenceRules(await getScrewPreferenceRules() as ScrewPreferenceRule[]);
  };

  // CRUD basic config (old screw_configurations table)
  const handleAddConfig = async () => {
    await addScrewConfig(form);
    setForm({
      plates_count: 1,
      screw_length: 25,
      screw_code: "",
      compatible_board_types: [],
      margin: 10,
      notes: "",
    });
    toast.success("Configurazione vite aggiunta!");
    setList(await getScrewConfigs());
  };
  const handleRemoveConfig = async (id: string) => {
    await removeScrewConfig(id);
    toast.success("Configurazione rimossa.");
    setList(await getScrewConfigs());
  };

  return (
    <div>
      <h2 className="font-semibold text-lg mb-2">Parametri Viti</h2>
      {/* Configurazione base */}
      <div className="grid grid-cols-5 gap-2 text-xs font-medium mb-2">
        <span># lastre</span>
        <span>Lunghezza (mm)</span>
        <span>Codice</span>
        <span>Tipologie lastre</span>
        <span>Margine</span>
      </div>
      {list.map(cfg => (
        <div key={cfg.id} className="grid grid-cols-5 gap-2 items-center border-b py-1">
          <span>{cfg.plates_count}</span>
          <span>{cfg.screw_length}</span>
          <span>{cfg.screw_code}</span>
          <span>{cfg.compatible_board_types.join(", ")}</span>
          <span>{cfg.margin}</span>
          <Button variant="ghost" size="sm" onClick={() => handleRemoveConfig(cfg.id)}>
            Rimuovi
          </Button>
        </div>
      ))}
      <div className="border-t mt-4 pt-4">
        <div className="flex gap-2">
          <Input
            type="number"
            min={1}
            value={form.plates_count}
            onChange={e => setForm(f => ({ ...f, plates_count: Number(e.target.value) }))}
            placeholder="# lastre"
            className="w-14"
          />
          <Input
            type="number"
            min={5}
            value={form.screw_length}
            onChange={e => setForm(f => ({ ...f, screw_length: Number(e.target.value) }))}
            placeholder="Lunghezza"
            className="w-20"
          />
          <Input
            value={form.screw_code}
            onChange={e => setForm(f => ({ ...f, screw_code: e.target.value }))}
            placeholder="Codice vite"
            className="w-20"
          />
          <Input
            value={form.compatible_board_types.join(",")}
            onChange={e => setForm(f => ({
              ...f,
              compatible_board_types: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
            }))}
            placeholder="Tipologie (gesso, cemento)"
            className="w-32"
          />
          <Input
            type="number"
            min={0}
            value={form.margin}
            onChange={e => setForm(f => ({ ...f, margin: Number(e.target.value) }))}
            className="w-14"
            placeholder="Margine"
          />
        </div>
        <div className="flex mt-2">
          <Input
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Note"
            className="flex-1"
          />
        </div>
        <Button type="button" onClick={async () => { await handleAddConfig(); }} className="mt-2" disabled={loading || !form.screw_code}>
          Aggiungi configurazione
        </Button>
      </div>

      {/* SEZIONE PERSONALIZZATA - Quantità viti per posizione */}
      <div className="mt-8">
        <h3 className="font-semibold text-md mb-2">Quantità Viti per Posizione</h3>
        <div className="grid grid-cols-4 gap-2 text-xs font-medium mb-2">
          <span>Posizione (nel blocco)</span>
          <span>Quantità viti/m²</span>
          <span>Descrizione</span>
        </div>
        {quantityRows.map(row => (
          <div key={row.id} className="grid grid-cols-4 gap-2 items-center border-b py-1">
            <span>{row.position_in_block}</span>
            <span>{row.quantity_per_sqm}</span>
            <span>{row.description}</span>
            <Button variant="ghost" size="sm" onClick={() => handleRemoveQuantity(row.id)}>Rimuovi</Button>
          </div>
        ))}
        <div className="flex mt-2 gap-2">
          <Input
            type="number"
            min={1} max={10}
            value={quantityForm.position_in_block}
            onChange={e => setQuantityForm(f => ({ ...f, position_in_block: Number(e.target.value) }))}
            placeholder="Posizione"
            className="w-14"
          />
          <Input
            type="number"
            min={1}
            value={quantityForm.quantity_per_sqm}
            onChange={e => setQuantityForm(f => ({ ...f, quantity_per_sqm: Number(e.target.value) }))}
            placeholder="Quantità"
            className="w-20"
          />
          <Input
            value={quantityForm.description}
            onChange={e => setQuantityForm(f => ({ ...f, description: e.target.value }))}
            placeholder="(opzionale)"
            className="w-40"
          />
          <Button variant="default" size="sm" type="button" onClick={handleAddQuantity}>
            Aggiungi/Modifica
          </Button>
        </div>
      </div>

      {/* SEZIONE PERSONALIZZATA - Preferenze per tipologia vite */}
      <div className="mt-8">
        <h3 className="font-semibold text-md mb-2">Preferenza ordine viti (per intervallo lunghezza minima)</h3>
        <div className="grid grid-cols-5 gap-2 text-xs font-medium mb-2">
          <span>Da mm (incl.)</span>
          <span>Fino a mm (facoltativo)</span>
          <span>Ordine preferito (codici, separati da virgola)</span>
          <span>Descrizione</span>
        </div>
        {preferenceRules.map(rule => (
          <div key={rule.id} className="grid grid-cols-5 gap-2 items-center border-b py-1">
            <span>{rule.min_length_mm}</span>
            <span>{rule.max_length_mm ?? "∞"}</span>
            <span>{rule.preferred_order.join(", ")}</span>
            <span>{rule.description}</span>
            <Button variant="ghost" size="sm" onClick={() => handleRemovePref(rule.id)}>
              Rimuovi
            </Button>
          </div>
        ))}
        <div className="flex mt-2 gap-2 items-center">
          <Input
            type="number"
            min={1}
            value={prefForm.min_length_mm}
            onChange={e => setPrefForm(f => ({ ...f, min_length_mm: Number(e.target.value) }))}
            placeholder="Da (mm)"
            className="w-20"
          />
          <Input
            type="number"
            min={1}
            value={prefForm.max_length_mm ?? ''}
            onChange={e => setPrefForm(f => ({ ...f, max_length_mm: e.target.value ? Number(e.target.value) : null }))}
            placeholder="Fino a (mm, facolt.)"
            className="w-24"
          />
          <Input
            value={prefForm.preferred_order.join(",")}
            onChange={e => setPrefForm(f => ({
              ...f,
              preferred_order: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
            }))}
            placeholder="Codici viti (TN45, TN50, ...)"
            className="w-40"
          />
          <Input
            value={prefForm.description}
            onChange={e => setPrefForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Descrizione"
            className="w-40"
          />
          <Button variant="default" size="sm" type="button" onClick={handleAddPref}>
            Aggiungi/Modifica
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ScrewSettings;

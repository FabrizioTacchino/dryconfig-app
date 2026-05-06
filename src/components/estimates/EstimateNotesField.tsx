
import React, { useState, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FileText, Check, Loader2, AlertCircle } from "lucide-react";

interface EstimateNotesFieldProps {
  note: string | undefined;
  onSave: (text: string) => Promise<void> | void;
  disabled?: boolean;
}

const PLACEHOLDER = 
  "Annota informazioni utili riguardanti questo preventivo: dettagli tecnici, richieste del cliente, aggiornamenti o scadenze importanti…";

const MAX_LENGTH = 5000;
const DEBOUNCE_DELAY = 4000; // 4 secondi

const EstimateNotesField: React.FC<EstimateNotesFieldProps> = ({
  note,
  onSave,
  disabled,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(note ?? "");
  const [charCount, setCharCount] = useState((note ?? "").length);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [dirty, setDirty] = useState(false);
  const debounceTimeout = useRef<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // --- Effetto per gestire la debounced auto-save ---
  useEffect(() => {
    // Non eseguire autosave se non siamo in editing o il valore non è cambiato
    if (!editing || value === note) return;

    setDirty(true);

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    // Salva in automatico dopo un periodo di inattività
    debounceTimeout.current = window.setTimeout(async () => {
      await doSave();
    }, DEBOUNCE_DELAY);

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
    // eslint-disable-next-line
  }, [value]);

  // Effetto per aggiornare value quando arrivano note nuove da sopra
  useEffect(() => {
    setValue(note ?? "");
    setCharCount((note ?? "").length);
    setDirty(false);
    setEditing(false);
    // eslint-disable-next-line
  }, [note]);

  // Effetto per il resize automatico
  useEffect(() => {
    setCharCount(value.length);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [value, expanded]);

  // Funzione di salvataggio centrale
  const doSave = async () => {
    if (saving || value === note) {
      setDirty(false);
      return;
    }
    setSaving(true);
    await onSave(value);
    setSaving(false);
    setSuccess(true);
    setDirty(false);
    setTimeout(() => setSuccess(false), 1200);
  };

  // Save forzato da blur/input/button
  const handleForceSave = async () => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    await doSave();
  };

  const handleExpand = () => setExpanded(true);

  const handleStartEdit = () => {
    setEditing(true);
    setExpanded(true);
    setTimeout(() => textareaRef.current?.focus(), 10);
  };

  const handleCancel = () => {
    setValue(note ?? "");
    setEditing(false);
    setDirty(false);
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
  };

  // Shortcut: Ctrl+Enter salva, Esc annulla
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.key === "Enter" && (e.ctrlKey || e.metaKey))) {
      e.preventDefault();
      handleForceSave();
      setEditing(false);
    }
    if (e.key === "Escape") {
      handleCancel();
    }
  };

  // --- GRAFICA COMPATTA & MIGLIORAMENTI STYLE ---
  return (
    <div
      className={`group mt-2 md:mt-1 w-full ${expanded ? "max-w-2xl" : "max-w-md"} transition-all`}
    >
      <div className="flex items-center gap-2 text-gray-700 mb-1">
        <FileText className="w-4 h-4" />
        <span className="font-semibold text-sm">Note preventivo</span>
        {charCount > 0 && (
          <span className="ml-2 text-xs px-2 py-0.5 bg-gray-100 rounded">
            {charCount}/{MAX_LENGTH}
          </span>
        )}
        {saving && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground ml-2" />}
        {dirty && !saving && (
          <span className="flex items-center text-[11px] text-yellow-600 ml-2">
            <AlertCircle className="w-3 h-3 mr-1" /> Modifiche non salvate
          </span>
        )}
        {success && <Check className="text-green-500 w-4 h-4 ml-2" />}
      </div>
      {expanded ? (
        <div className="relative">
          <Textarea
            ref={textareaRef}
            className="mt-1 w-full min-h-[92px] max-h-56 border resize-none text-sm bg-white shadow-sm"
            placeholder={PLACEHOLDER}
            value={value}
            disabled={disabled || saving}
            maxLength={MAX_LENGTH}
            onChange={e => {
              setValue(e.target.value);
              setDirty(true);
              setEditing(true);
            }}
            onFocus={() => setEditing(true)}
            onBlur={handleForceSave}
            onKeyDown={handleKeyDown}
            autoFocus={editing}
          />
          <div className="mt-1 flex gap-2 justify-end">
            {editing && (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    handleForceSave();
                    setEditing(false);
                  }}
                  disabled={saving || value === note}
                >
                  Salva
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Annulla
                </Button>
              </>
            )}
            {!editing && (
              <Button type="button" size="sm" variant="ghost" onClick={() => setExpanded(false)}>
                Chiudi
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div
          className={
            "w-full cursor-pointer rounded bg-gray-50 px-3 py-2 hover:bg-gray-100 border border-gray-200 min-h-[42px] text-sm transition-all shadow-sm flex items-center" +
            (note && note.trim() ? " text-gray-800" : " text-gray-400")
          }
          onClick={handleExpand}
        >
          {note && note.trim() ? (
            <div className="w-full flex justify-between items-center">
              <span className="truncate">
                {note.length > 80
                  ? note.slice(0, 80) + "…"
                  : note}
              </span>
              <span className="ml-2 text-primary underline text-xs whitespace-nowrap">Espandi</span>
            </div>
          ) : (
            <span>
              + Aggiungi note al preventivo
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default EstimateNotesField;

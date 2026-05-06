
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Check, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ProjectNameEditableProps {
  name: string;
  projectId: string;
  onSaved?: () => void; // reload or update
  disabled?: boolean;
}

export const ProjectNameEditable: React.FC<ProjectNameEditableProps> = ({
  name,
  projectId,
  onSaved,
  disabled = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tmpName, setTmpName] = useState<string>(name);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveName = async () => {
    if (!tmpName || tmpName.trim() === "") {
      toast({ title: "Il nome non può essere vuoto" });
      return;
    }
    setIsSaving(true);
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { error: updateError } = await supabase
        .from("projects")
        .update({ name: tmpName })
        .eq("id", projectId);

      if (updateError) throw updateError;

      toast({ title: "Nome progetto aggiornato!" });
      setIsEditing(false);
      if (onSaved) onSaved();
      else window.location.reload();
    } catch {
      toast({ title: "Errore nel salvataggio del nome" });
    }
    setIsSaving(false);
  };

  return (
    <div className="flex items-center gap-3">
      {isEditing ? (
        <>
          <Input
            value={tmpName}
            onChange={e => setTmpName(e.target.value)}
            className="max-w-xs"
            disabled={isSaving || disabled}
            autoFocus
            onKeyDown={e => {
              if (e.key === "Enter") handleSaveName();
              if (e.key === "Escape") {
                setIsEditing(false);
                setTmpName(name);
              }
            }}
          />
          <Button
            size="icon"
            variant="ghost"
            onClick={handleSaveName}
            disabled={isSaving}
            aria-label="Salva"
          >
            <Check className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              setIsEditing(false);
              setTmpName(name);
            }}
            disabled={isSaving}
            aria-label="Annulla"
          >
            <X className="w-4 h-4" />
          </Button>
        </>
      ) : (
        <>
          <h1 className="text-3xl font-bold tracking-tight">{name}</h1>
          <Button
            size="icon"
            variant="ghost"
            disabled={disabled}
            onClick={() => {
              setIsEditing(true);
              setTmpName(name);
            }}
            aria-label="Modifica nome"
          >
            <Pencil className="w-4 h-4" />
          </Button>
        </>
      )}
    </div>
  );
};

export default ProjectNameEditable;

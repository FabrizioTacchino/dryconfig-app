
import React, { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { ProjectStatus } from "@/types";
import { toast } from "@/hooks/use-toast";

interface ProjectStatusBadgeEditableProps {
  status: ProjectStatus;
  projectId: string;
  reloadOnChange?: boolean;
}

const statusColors: Record<ProjectStatus, string> = {
  active: "bg-green-100 text-green-800 border-green-200",
  completed: "bg-blue-100 text-blue-800 border-blue-200",
  archived: "bg-gray-100 text-gray-800 border-gray-200",
};

const statusLabels: Record<ProjectStatus, string> = {
  active: "Attivo",
  completed: "Completato",
  archived: "Archiviato",
};

// Nuova height e width badge + compact select
const badgeClassBase =
  "text-sm font-semibold rounded-full px-3 py-1 border transition cursor-pointer flex items-center min-w-[76px] h-8";

export const ProjectStatusBadgeEditable: React.FC<ProjectStatusBadgeEditableProps> = ({
  status,
  projectId,
  reloadOnChange = true,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tmpStatus, setTmpStatus] = useState<ProjectStatus>(status);
  const [isSaving, setIsSaving] = useState(false);
  const selectTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setTmpStatus(status);
  }, [status]);

  const handleSaveStatus = async (newStatus: ProjectStatus) => {
    if (newStatus === status) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { error: updateError } = await supabase
        .from("projects")
        .update({ status: newStatus })
        .eq("id", projectId);

      if (updateError) throw updateError;

      toast({ title: "Stato progetto aggiornato!" });
      setIsEditing(false);
      setTmpStatus(newStatus);
      if (reloadOnChange) window.location.reload();
    } catch (e) {
      toast({ title: "Errore nel salvataggio dello stato" });
      console.error("Errore stato progetto:", e);
    }
    setIsSaving(false);
  };

  // Menu dropdown più compatto e meno largo!
  return isEditing ? (
    <Select
      value={tmpStatus}
      onValueChange={(value) => {
        const newStatus = value as ProjectStatus;
        setTmpStatus(newStatus);
        handleSaveStatus(newStatus);
      }}
      disabled={isSaving}
      open={isEditing}
      onOpenChange={(open) => {
        if (!open && !isSaving) setIsEditing(false);
      }}
    >
      <SelectTrigger
        className={`${badgeClassBase} ${statusColors[tmpStatus]} shadow-none ring-1 ring-gray-200 focus:ring-primary border ${isSaving ? "opacity-60 pointer-events-none" : ""} w-auto min-w-[76px] max-w-[140px]`}
        aria-label="Seleziona stato progetto"
        ref={selectTriggerRef}
        autoFocus
        style={{ zIndex: 60 }}
      >
        <SelectValue>
          {statusLabels[tmpStatus]}
        </SelectValue>
      </SelectTrigger>
      <SelectContent
        className="z-[100] bg-white border rounded-xl py-1 px-0 min-w-[130px] w-[130px] max-w-[180px] shadow-lg animate-fade-in"
        style={{ fontSize: "0.97rem" }}
        sideOffset={6}
      >
        <SelectItem
          value="active"
          className="px-3 py-2 rounded cursor-pointer transition-colors data-[state=checked]:bg-green-100 data-[state=checked]:text-green-800"
        >
          {statusLabels.active}
        </SelectItem>
        <SelectItem
          value="completed"
          className="px-3 py-2 rounded cursor-pointer transition-colors data-[state=checked]:bg-blue-100 data-[state=checked]:text-blue-800"
        >
          {statusLabels.completed}
        </SelectItem>
        <SelectItem
          value="archived"
          className="px-3 py-2 rounded cursor-pointer transition-colors data-[state=checked]:bg-gray-100 data-[state=checked]:text-gray-800"
        >
          {statusLabels.archived}
        </SelectItem>
      </SelectContent>
    </Select>
  ) : (
    <Badge
      className={`${badgeClassBase} ${statusColors[status]} hover:brightness-95 outline-none focus:ring-2 focus:ring-primary`}
      tabIndex={0}
      onClick={() => {
        setIsEditing(true);
        setTmpStatus(status);
        setTimeout(() => {
          selectTriggerRef.current?.focus();
        }, 50);
      }}
      onKeyDown={e => {
        if (e.key === "Enter" || e.key === " ") {
          setIsEditing(true);
          setTmpStatus(status);
          setTimeout(() => {
            selectTriggerRef.current?.focus();
          }, 50);
        }
      }}
      aria-label="Clicca per modificare lo stato"
    >
      {statusLabels[status]}
    </Badge>
  );
};

export default ProjectStatusBadgeEditable;

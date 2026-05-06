
import React, { useEffect, useState } from "react";
import { useConfiguratorSettings } from "@/hooks/useConfiguratorSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const LaborSettings = () => {
  const { getSetting, setSetting } = useConfiguratorSettings();
  const { toast } = useToast();
  const [costPerHour, setCostPerHour] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSetting("cost_per_hour").then((val) => {
      setCostPerHour(val || "");
      setLoading(false);
    });
  }, [getSetting]);

  const handleSave = async () => {
    try {
      await setSetting("cost_per_hour", costPerHour);
      toast({
        title: "Successo",
        description: `Costo Orario Manodopera impostato correttamente a: ${costPerHour}€/h`,
      });
    } catch (error) {
      console.error('Error saving cost per hour:', error);
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Errore durante il salvataggio del costo orario",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-md space-y-4">
      <h2 className="font-semibold text-lg mb-2">Costo Orario Manodopera</h2>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={0}
          value={costPerHour}
          onChange={e => setCostPerHour(e.target.value)}
          disabled={loading}
          className="w-32"
          step={0.01}
          placeholder="€/ora"
        />
        <span className="ml-2 text-muted-foreground">€/h</span>
      </div>
      <Button type="button" onClick={handleSave} disabled={loading || costPerHour === ""}>
        Salva
      </Button>
    </div>
  );
};

export default LaborSettings;


import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LaborSettings from "./settings/LaborSettings";
import ScrewSettings from "./settings/ScrewSettings";
import { Wrench, CalendarCheck } from "lucide-react";

const ConfiguratorSettings = () => {
  const [tab, setTab] = useState("labor");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Wrench className="h-6 w-6 text-construction-primary" />
        <h1 className="text-2xl font-bold tracking-tight">
          Impostazioni Configuratore
        </h1>
      </div>
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="labor" className="flex items-center gap-2">
            <CalendarCheck className="h-4 w-4" /> Manodopera
          </TabsTrigger>
          <TabsTrigger value="screws" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" /> Viti
          </TabsTrigger>
        </TabsList>
        <TabsContent value="labor">
          <LaborSettings />
        </TabsContent>
        <TabsContent value="screws">
          <ScrewSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConfiguratorSettings;

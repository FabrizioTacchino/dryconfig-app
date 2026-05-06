
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Package, Settings, Shield } from 'lucide-react';
import MaterialsManagement from './MaterialsManagement';
import UsersManagement from './UsersManagement';
import ConfiguratorSettings from './ConfiguratorSettings';

const AdminPanel = () => {
  const [tab, setTab] = useState('materials');
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6 text-construction-primary" />
        <h1 className="text-3xl font-bold tracking-tight">Pannello Amministratore</h1>
      </div>
      
      <Tabs value={tab} onValueChange={setTab} defaultValue="materials" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="materials" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Materiali
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Utenti
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Impostazioni
          </TabsTrigger>
          <TabsTrigger value="configurator" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Configuratore
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="materials" className="mt-6">
          <MaterialsManagement />
        </TabsContent>
        
        <TabsContent value="users" className="mt-6">
          <UsersManagement />
        </TabsContent>
        
        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Impostazioni Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Funzionalità di configurazione del sistema disponibili prossimamente.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="configurator" className="mt-6">
          <ConfiguratorSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;

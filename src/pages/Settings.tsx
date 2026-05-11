
import React, { useState, useEffect } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/AppSidebar';
import Header from '@/components/layout/Header';
import PageContainer from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Settings as SettingsIcon, Bell, Shield, Palette } from 'lucide-react';
import { createNotification } from '@/utils/notificationUtils';
import BackButton from '@/components/layout/BackButton';
import WasteFactorsCard from '@/components/settings/WasteFactorsCard';
import FinishLevelsCard from '@/components/settings/FinishLevelsCard';
import ScrewPreferencesCard from '@/components/settings/ScrewPreferencesCard';

const Settings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    marketingEmails: false,
    darkMode: false
  });
  const [loading, setLoading] = useState(false);

  const handleSettingChange = (key: keyof typeof settings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Simula il salvataggio delle impostazioni
      // In una vera applicazione, salveresti queste impostazioni nel database
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Impostazioni salvate con successo');
      
      // Crea una notifica di esempio per testare il sistema
      await createNotification(
        'Impostazioni aggiornate',
        'Le tue impostazioni sono state salvate correttamente.',
        'success'
      );
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Errore durante il salvataggio delle impostazioni');
    } finally {
      setLoading(false);
    }
  };

  const handleTestNotification = async () => {
    if (!user) return;

    try {
      await createNotification(
        'Notifica di test',
        'Questa è una notifica di test per verificare il funzionamento del sistema.',
        'info'
      );
      toast.success('Notifica di test creata');
    } catch (error) {
      console.error('Error creating test notification:', error);
      toast.error('Errore durante la creazione della notifica di test');
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-col">
          <Header />
          <PageContainer>
            <div className="mb-4">
              <BackButton />
            </div>
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">Impostazioni</h1>
              <p className="text-muted-foreground mt-1">
                Configura le tue preferenze e impostazioni dell'applicazione
              </p>
            </div>

            <div className="max-w-2xl space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notifiche
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-notifications">Notifiche Email</Label>
                      <p className="text-sm text-muted-foreground">
                        Ricevi notifiche via email per aggiornamenti importanti
                      </p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="push-notifications">Notifiche Push</Label>
                      <p className="text-sm text-muted-foreground">
                        Ricevi notifiche push nel browser
                      </p>
                    </div>
                    <Switch
                      id="push-notifications"
                      checked={settings.pushNotifications}
                      onCheckedChange={(checked) => handleSettingChange('pushNotifications', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="marketing-emails">Email Marketing</Label>
                      <p className="text-sm text-muted-foreground">
                        Ricevi aggiornamenti su nuove funzionalità e offerte
                      </p>
                    </div>
                    <Switch
                      id="marketing-emails"
                      checked={settings.marketingEmails}
                      onCheckedChange={(checked) => handleSettingChange('marketingEmails', checked)}
                    />
                  </div>

                  <Separator />

                  <Button onClick={handleTestNotification} variant="outline">
                    Crea Notifica di Test
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Aspetto
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="dark-mode">Modalità Scura</Label>
                      <p className="text-sm text-muted-foreground">
                        Attiva il tema scuro dell'interfaccia
                      </p>
                    </div>
                    <Switch
                      id="dark-mode"
                      checked={settings.darkMode}
                      onCheckedChange={(checked) => handleSettingChange('darkMode', checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              <WasteFactorsCard />

              <FinishLevelsCard />

              <ScrewPreferencesCard />

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Sicurezza
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label>Account</Label>
                      <p className="text-sm text-muted-foreground mb-2">
                        Gestisci le impostazioni di sicurezza del tuo account
                      </p>
                      <Button variant="outline" disabled>
                        Cambia Password
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button onClick={handleSaveSettings} disabled={loading}>
                  {loading ? 'Salvataggio...' : 'Salva Impostazioni'}
                </Button>
              </div>
            </div>
          </PageContainer>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Settings;

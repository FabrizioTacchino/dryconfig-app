
import React, { useState } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/AppSidebar';
import Header from '@/components/layout/Header';
import PageContainer from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User, Mail, Building } from 'lucide-react';
import BackButton from '@/components/layout/BackButton';

const Profile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    company: ''
  });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email || '',
          name: profile.name,
          company: profile.company,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast.success('Profilo aggiornato con successo');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Errore durante l\'aggiornamento del profilo');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('name, company')
        .eq('id', user.id)
        .single();

      if (data) {
        setProfile({
          name: data.name || '',
          company: data.company || ''
        });
      }
    };

    fetchProfile();
  }, [user]);

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
              <h1 className="text-3xl font-bold tracking-tight">Profilo</h1>
              <p className="text-muted-foreground mt-1">
                Gestisci le informazioni del tuo profilo
              </p>
            </div>

            <div className="max-w-2xl">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Informazioni Personali
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          value={user?.email || ''}
                          disabled
                          className="pl-10"
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        L'email non può essere modificata
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="name">Nome</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="name"
                          type="text"
                          value={profile.name}
                          onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Il tuo nome"
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="company">Azienda</Label>
                      <div className="relative">
                        <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="company"
                          type="text"
                          value={profile.company}
                          onChange={(e) => setProfile(prev => ({ ...prev, company: e.target.value }))}
                          placeholder="Nome dell'azienda"
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <Button type="submit" disabled={loading}>
                      {loading ? 'Aggiornamento...' : 'Aggiorna Profilo'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </PageContainer>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Profile;

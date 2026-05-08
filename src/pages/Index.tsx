import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, Calculator, FileText, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/brand/Logo';

const Index = () => {
  const navigate = useNavigate();
  const {
    user,
    loading
  } = useAuth();
  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);
  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-construction-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Caricamento...</p>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <Logo size={64} />
          </div>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto px-0">
            Sistema professionale per la configurazione e preventivazione<br />
            di pareti a secco, contropareti e controsoffitti
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => navigate('/auth')} size="lg">
              Accedi
            </Button>
            <Button onClick={() => navigate('/auth')} variant="outline" size="lg">
              Registrati
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card>
            <CardHeader>
              <Building className="h-8 w-8 text-construction-primary mb-2" />
              <CardTitle>Progetti</CardTitle>
              <CardDescription>
                Gestisci i tuoi progetti di costruzione e tieni traccia dello stato di avanzamento
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Calculator className="h-8 w-8 text-construction-primary mb-2" />
              <CardTitle>Configuratore</CardTitle>
              <CardDescription>
                Configura pareti, contropareti e controsoffitti con stratigrafie personalizzate
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <FileText className="h-8 w-8 text-construction-primary mb-2" />
              <CardTitle>Preventivi</CardTitle>
              <CardDescription>
                Crea preventivi dettagliati e professionali per i tuoi clienti
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-8 w-8 text-construction-primary mb-2" />
              <CardTitle>Certificazioni</CardTitle>
              <CardDescription>
                Gestisci le certificazioni antincendio e acustiche per i tuoi progetti
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Perché scegliere DryConfig?</CardTitle>
            </CardHeader>
            <CardContent className="text-left space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-construction-primary rounded-full mt-2"></div>
                <p>Database completo di materiali e stratigrafie certificate</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-construction-primary rounded-full mt-2"></div>
                <p>Calcolo automatico dei costi per metro quadro</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-construction-primary rounded-full mt-2"></div>
                <p>Gestione dei ruoli utente per team di lavoro</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-construction-primary rounded-full mt-2"></div>
                <p>Generazione automatica di preventivi professionali</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground">
            Sviluppato da <strong>Fabrizio Tacchino</strong> - Sistema professionale per l'edilizia a secco
          </p>
        </div>
      </div>
    </div>;
};

export default Index;

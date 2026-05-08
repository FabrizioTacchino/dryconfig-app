import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/brand/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { useInvitationPreview, useAcceptInvitation } from '@/hooks/useTeamManagement';
import { toast } from 'sonner';

const ROLE_LABEL: Record<string, string> = {
  owner: 'Proprietario',
  admin: 'Amministratore',
  manager: 'Manager',
  technician: 'Tecnico',
  viewer: 'Lettura',
};

const AcceptInvite: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const { data: invitation, isLoading: loadingInvite, error } = useInvitationPreview(token ?? null);
  const accept = useAcceptInvitation();
  const [accepting, setAccepting] = useState(false);

  // Save the token in sessionStorage so we can resume after login/signup
  useEffect(() => {
    if (token) sessionStorage.setItem('pendingInviteToken', token);
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    setAccepting(true);
    try {
      await accept.mutateAsync(token);
      sessionStorage.removeItem('pendingInviteToken');
      toast.success(`Benvenuto in ${invitation?.organization_name}!`);
      navigate('/dashboard');
    } catch (e: any) {
      const msg = e?.message ?? 'Errore';
      const code = msg.match(/invitation_\w+|authentication_required/)?.[0];
      const friendly: Record<string, string> = {
        authentication_required: 'Devi prima accedere o registrarti.',
        invitation_not_found: 'Invito non trovato.',
        invitation_already_accepted: 'Questo invito è già stato accettato.',
        invitation_revoked: 'Questo invito è stato revocato.',
        invitation_expired: 'Questo invito è scaduto.',
        invitation_email_mismatch: `Devi accedere con l'email ${invitation?.invitation_email}.`,
      };
      toast.error(friendly[code ?? ''] ?? msg);
    } finally {
      setAccepting(false);
    }
  };

  if (loadingInvite || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Caricamento invito…</p>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2"><Logo size={40} /></div>
            <CardTitle>Invito non valido</CardTitle>
            <CardDescription>Il link è errato o l'invito non esiste più.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate('/auth')}>Vai all'accesso</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invitation.is_revoked) return <Status title="Invito revocato" desc="Questo invito è stato revocato." />;
  if (invitation.is_accepted) return <Status title="Invito già accettato" desc="Questo invito è già stato usato." />;
  if (invitation.is_expired)  return <Status title="Invito scaduto" desc="Chiedi al tuo admin di rimandartelo." />;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2"><Logo size={40} /></div>
          <CardTitle>Sei stato invitato</CardTitle>
          <CardDescription>
            <span className="font-medium">{invitation.organization_name}</span> ti ha invitato a
            unirti come <span className="font-medium">{ROLE_LABEL[invitation.invitation_role] ?? invitation.invitation_role}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-muted/40 p-3 text-sm">
            <p>L'invito è destinato a <span className="font-medium">{invitation.invitation_email}</span>.</p>
            <p className="mt-1 text-muted-foreground">Devi accedere con questa email per accettarlo.</p>
          </div>

          {!user ? (
            <div className="space-y-2">
              <Button
                className="w-full"
                onClick={() => navigate('/auth?mode=signup&email=' + encodeURIComponent(invitation.invitation_email))}
              >
                Registrati con {invitation.invitation_email}
              </Button>
              <Button variant="outline" className="w-full" onClick={() => navigate('/auth')}>
                Ho già un account, accedi
              </Button>
            </div>
          ) : user.email?.toLowerCase() !== invitation.invitation_email.toLowerCase() ? (
            <div className="space-y-2">
              <p className="text-sm text-destructive">
                Stai usando <span className="font-mono">{user.email}</span>, ma l'invito è per
                <span className="font-mono"> {invitation.invitation_email}</span>.
              </p>
              <Button variant="outline" className="w-full" onClick={() => navigate('/auth')}>
                Accedi con l'email corretta
              </Button>
            </div>
          ) : (
            <Button className="w-full" disabled={accepting} onClick={handleAccept}>
              {accepting ? 'Accetto…' : 'Accetta invito'}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const Status: React.FC<{ title: string; desc: string }> = ({ title, desc }) => (
  <div className="min-h-screen flex items-center justify-center p-4">
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2"><Logo size={40} /></div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{desc}</CardDescription>
      </CardHeader>
    </Card>
  </div>
);

export default AcceptInvite;

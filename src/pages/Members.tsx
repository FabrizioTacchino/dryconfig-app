import React, { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Copy, Trash2, UserPlus, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import {
  useOrganizationMembers,
  useUpdateMemberRole,
  useRemoveMember,
  useOrganizationInvitations,
  useInviteMember,
  useRevokeInvitation,
  type OrganizationRole,
} from '@/hooks/useTeamManagement';
import { useCurrentOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import BackButton from '@/components/layout/BackButton';

const ROLE_OPTIONS: { value: OrganizationRole; label: string; description: string }[] = [
  { value: 'owner',      label: 'Titolare',       description: 'Pieni poteri, gestione billing ed eliminazione organizzazione' },
  { value: 'admin',      label: 'Amministratore', description: 'Gestione team, fornitori, sconti, impostazioni org' },
  { value: 'supervisor', label: 'Supervisore',    description: 'Approva eliminazione progetti/preventivi, gestisce flussi del team' },
  { value: 'technician', label: 'Tecnico',        description: 'Crea e modifica progetti, preventivi e stratigrafie (no eliminazione)' },
  { value: 'viewer',     label: 'Visualizzatore', description: 'Sola lettura su tutto' },
];

const Members: React.FC = () => {
  const { user } = useAuth();
  const { currentRole, currentOrganization } = useCurrentOrganization();
  const canManage = currentRole === 'owner' || currentRole === 'admin';

  const { data: members = [], isLoading: loadingMembers } = useOrganizationMembers();
  const { data: invitations = [], isLoading: loadingInvites } = useOrganizationInvitations();

  const updateRole   = useUpdateMemberRole();
  const removeMember = useRemoveMember();
  const inviteMember = useInviteMember();
  const revokeInvite = useRevokeInvitation();

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<OrganizationRole>('technician');

  const pendingInvitations = useMemo(
    () => invitations.filter(i => !i.accepted_at && !i.revoked_at && new Date(i.expires_at) > new Date()),
    [invitations],
  );

  const buildInviteUrl = (token: string) => `${window.location.origin}/invite/${token}`;

  const copyInviteLink = (token: string) => {
    navigator.clipboard.writeText(buildInviteUrl(token));
    toast.success('Link copiato negli appunti');
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    inviteMember.mutate(
      { email: inviteEmail, role: inviteRole },
      {
        onSuccess: (inv) => {
          setInviteEmail('');
          setInviteRole('technician');
          // Auto-copy link
          navigator.clipboard.writeText(buildInviteUrl(inv.token));
          toast.success('Link copiato — invialo al destinatario');
        },
      },
    );
  };

  if (!currentOrganization) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-muted-foreground">Nessuna organizzazione attiva.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <BackButton />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Membri del team</h1>
        <p className="text-muted-foreground text-sm">
          Gestisci chi può accedere a <span className="font-medium">{currentOrganization.name}</span> e con quale ruolo.
        </p>
      </div>

      {/* Invite form (admin/owner only) */}
      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" /> Invita un nuovo membro
            </CardTitle>
            <CardDescription>
              Genera un link di invito da inviare via email/WhatsApp. Scade dopo 14 giorni.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="grid grid-cols-1 md:grid-cols-[1fr_220px_auto] gap-3 items-end">
              <div>
                <Label htmlFor="invite-email">Email destinatario</Label>
                <Input
                  id="invite-email"
                  type="email"
                  required
                  placeholder="nome@azienda.it"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="invite-role">Ruolo</Label>
                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as OrganizationRole)}>
                  <SelectTrigger id="invite-role"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map(r => (
                      <SelectItem key={r.value} value={r.value}>
                        <div className="flex flex-col">
                          <span>{r.label}</span>
                          <span className="text-xs text-muted-foreground">{r.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={inviteMember.isPending}>
                {inviteMember.isPending ? 'Creo...' : 'Crea invito'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Members table */}
      <Card>
        <CardHeader>
          <CardTitle>Membri attivi ({members.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingMembers ? (
            <p className="text-muted-foreground text-sm">Caricamento…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Ruolo</TableHead>
                  <TableHead>Iscritto</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map(m => {
                  const isSelf = m.user_id === user?.id;
                  return (
                    <TableRow key={m.membership_id}>
                      <TableCell>{m.name || '—'} {isSelf && <Badge variant="secondary">Tu</Badge>}</TableCell>
                      <TableCell>{m.email}</TableCell>
                      <TableCell>
                        {canManage && !isSelf ? (
                          <Select
                            value={m.role}
                            onValueChange={(v) => updateRole.mutate({ membershipId: m.membership_id, newRole: v as OrganizationRole })}
                          >
                            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {ROLE_OPTIONS.map(r => (
                                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge>{ROLE_OPTIONS.find(r => r.value === m.role)?.label ?? m.role}</Badge>
                        )}
                      </TableCell>
                      <TableCell>{new Date(m.joined_at).toLocaleDateString('it-IT')}</TableCell>
                      <TableCell className="text-right">
                        {canManage && !isSelf && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm(`Rimuovere ${m.email} dall'organizzazione?`)) {
                                removeMember.mutate(m.membership_id);
                              }
                            }}
                            title="Rimuovi"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pending invitations */}
      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle>Inviti in attesa ({pendingInvitations.length})</CardTitle>
            <CardDescription>
              Per ogni invito copia il link e invialo al destinatario via email o WhatsApp.
              In Fase 2 attiveremo l'invio automatico via email.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingInvites ? (
              <p className="text-muted-foreground text-sm">Caricamento…</p>
            ) : pendingInvitations.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nessun invito pendente.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Ruolo</TableHead>
                    <TableHead>Scade</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingInvitations.map(i => (
                    <TableRow key={i.id}>
                      <TableCell className="font-medium">{i.email}</TableCell>
                      <TableCell>
                        <Badge>{ROLE_OPTIONS.find(r => r.value === i.role)?.label ?? i.role}</Badge>
                      </TableCell>
                      <TableCell>{new Date(i.expires_at).toLocaleDateString('it-IT')}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="outline" size="sm" onClick={() => copyInviteLink(i.token)}>
                          <Copy className="h-4 w-4 mr-1" /> Copia link
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Revoca invito"
                          onClick={() => {
                            if (confirm(`Revocare l'invito a ${i.email}?`)) {
                              revokeInvite.mutate(i.id);
                            }
                          }}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Members;

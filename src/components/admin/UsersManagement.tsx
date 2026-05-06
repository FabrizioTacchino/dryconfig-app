
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, UserPlus, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];

interface UserWithRoles {
  id: string;
  email: string;
  name: string;
  roles: UserRole[];
}

interface UserRoleRow {
  id: string | null;
  user_id: string | null;
  role: UserRole | null;
  created_at: string | null;
  user_name: string | null;
  user_email: string | null;
}

const UsersManagement = () => {
  const [users, setUsers] = useState<UserRoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      console.log('Fetching users from user_roles_with_names view...');
      
      // Use the existing view that combines user roles with profile information
      const { data: userRoles, error } = await supabase
        .from('user_roles_with_names')
        .select('*')
        .order('user_email');

      if (error) {
        console.error('Error fetching user roles:', error);
        throw error;
      }

      console.log('Fetched user roles:', userRoles);
      setUsers(userRoles || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Errore nel caricamento degli utenti');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      console.log('Adding role:', newRole, 'to user:', userId);
      
      const { error } = await supabase
        .from('user_roles')
        .upsert({ user_id: userId, role: newRole });

      if (error) {
        console.error('Error updating role:', error);
        throw error;
      }
      
      toast.success('Ruolo aggiornato con successo');
      fetchUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Errore nell\'aggiornamento del ruolo');
    }
  };

  const removeRole = async (userId: string, role: UserRole) => {
    if (role === 'user') {
      toast.error('Non è possibile rimuovere il ruolo base "user"');
      return;
    }

    try {
      console.log('Removing role:', role, 'from user:', userId);
      
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);

      if (error) {
        console.error('Error removing role:', error);
        throw error;
      }
      
      toast.success('Ruolo rimosso con successo');
      fetchUsers();
    } catch (error) {
      console.error('Error removing role:', error);
      toast.error('Errore nella rimozione del ruolo');
    }
  };

  // Group users by user_id to show all roles for each user
  const groupedUsers = users.reduce((acc, userRole) => {
    const userId = userRole.user_id;
    if (!userId) return acc;
    
    if (!acc[userId]) {
      acc[userId] = {
        id: userId,
        email: userRole.user_email || '',
        name: userRole.user_name || '',
        roles: []
      };
    }
    
    if (userRole.role) {
      acc[userId].roles.push(userRole.role);
    }
    
    return acc;
  }, {} as Record<string, UserWithRoles>);

  const usersArray = Object.values(groupedUsers);

  const filteredUsers = usersArray.filter((user: UserWithRoles) =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleLabel = (role: UserRole) => {
    const labels = {
      user: 'Utente',
      power_user: 'Utente Avanzato',
      technical_validator: 'Validatore Tecnico',
      admin: 'Amministratore',
      super_user: 'Super Utente'
    };
    return labels[role];
  };

  const getRoleColor = (role: UserRole) => {
    const colors = {
      user: 'bg-gray-100 text-gray-800',
      power_user: 'bg-blue-100 text-blue-800',
      technical_validator: 'bg-purple-100 text-purple-800',
      admin: 'bg-red-100 text-red-800',
      super_user: 'bg-yellow-100 text-yellow-800'
    };
    return colors[role];
  };

  const hasRole = (userRoles: UserRole[], role: UserRole) => {
    return userRoles.includes(role);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Cerca utenti..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <p>Caricamento utenti...</p>
        ) : filteredUsers.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            {searchTerm ? 'Nessun utente trovato con i criteri di ricerca.' : 'Nessun utente presente.'}
          </p>
        ) : (
          filteredUsers.map((user: UserWithRoles) => (
            <Card key={user.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{user.name || 'Nome non disponibile'}</h3>
                      <span className="text-sm text-muted-foreground">{user.email}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {user.roles.map((role) => (
                        <div key={role} className="flex items-center gap-1">
                          <Badge className={getRoleColor(role)}>
                            {getRoleLabel(role)}
                          </Badge>
                          {role !== 'user' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                              onClick={() => removeRole(user.id, role)}
                            >
                              ×
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Select onValueChange={(role: UserRole) => handleRoleChange(user.id, role)}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Aggiungi ruolo" />
                      </SelectTrigger>
                      <SelectContent>
                        {!hasRole(user.roles, 'power_user') && (
                          <SelectItem value="power_user">Utente Avanzato</SelectItem>
                        )}
                        {!hasRole(user.roles, 'technical_validator') && (
                          <SelectItem value="technical_validator">Validatore Tecnico</SelectItem>
                        )}
                        {!hasRole(user.roles, 'admin') && (
                          <SelectItem value="admin">Amministratore</SelectItem>
                        )}
                        {!hasRole(user.roles, 'super_user') && (
                          <SelectItem value="super_user">Super Utente</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default UsersManagement;

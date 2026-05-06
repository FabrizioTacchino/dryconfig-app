
import { supabase } from '@/integrations/supabase/client';

export const createNotification = async (
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info'
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('User not authenticated');
      return;
    }

    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        title,
        message,
        type
      });

    if (error) throw error;
    
    console.log('Notification created successfully');
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

// Esempi di utilizzo:
export const notificationExamples = {
  stratigraphySaved: (name: string) => 
    createNotification(
      'Stratigrafia salvata', 
      `La stratigrafia "${name}" è stata salvata con successo`, 
      'success'
    ),
  
  estimateCreated: (name: string) => 
    createNotification(
      'Preventivo creato', 
      `Il preventivo "${name}" è stato creato con successo`, 
      'success'
    ),
  
  materialUpdated: () => 
    createNotification(
      'Materiali aggiornati', 
      'I prezzi dei materiali sono stati aggiornati', 
      'info'
    ),
  
  validationError: (message: string) => 
    createNotification(
      'Errore di validazione', 
      message, 
      'error'
    )
};

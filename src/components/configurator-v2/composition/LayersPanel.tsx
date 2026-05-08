import React from 'react';
import { Card } from '@/components/ui/card';
import { Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Pannello sinistro: lista dei layer della stratigrafia (drag&drop in V2.0-S4).
 *
 * Per V2.0-S2 è ancora un placeholder con i due pulsanti principali.
 * Vedi `docs/mockupui.md` §7.
 */
const LayersPanel: React.FC = () => {
  return (
    <div className="space-y-4">
      {/* CTA principali */}
      <div className="grid gap-2">
        <Button variant="outline" className="justify-start gap-2 h-12">
          <Sparkles className="h-4 w-4 text-primary" />
          Aggiungi sistema certificato (W111, W112, …)
        </Button>
        <Button variant="default" className="justify-start gap-2 h-12">
          <Plus className="h-4 w-4" />
          Aggiungi layer da zero
        </Button>
      </div>

      {/* Lista layer (placeholder) */}
      <Card className="p-6 text-center text-sm text-muted-foreground border-dashed">
        Lista layer in arrivo nel prossimo step (drag&drop con dnd-kit + zone semantiche).
      </Card>
    </div>
  );
};

export default LayersPanel;

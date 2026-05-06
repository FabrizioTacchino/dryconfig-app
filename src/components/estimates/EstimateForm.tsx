
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, FileText, FileUp, FilePlus, Trash2 } from 'lucide-react';

const EstimateForm = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dettagli preventivo</CardTitle>
          <CardDescription>
            Inserisci le informazioni generali del preventivo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="estimate-name">Nome preventivo</Label>
                <Input id="estimate-name" placeholder="Inserisci nome preventivo" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimate-version">Versione</Label>
                <Input id="estimate-version" placeholder="1.0" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="estimate-description">Descrizione</Label>
              <Textarea
                id="estimate-description"
                placeholder="Inserisci una descrizione per questo preventivo"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="estimate-status">Stato</Label>
                <Select defaultValue="draft">
                  <SelectTrigger id="estimate-status">
                    <SelectValue placeholder="Seleziona stato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Bozza</SelectItem>
                    <SelectItem value="pending">In approvazione</SelectItem>
                    <SelectItem value="approved">Approvato</SelectItem>
                    <SelectItem value="contracted">Contrattualizzato</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimate-date">Data</Label>
                <Input id="estimate-date" type="date" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Pareti</CardTitle>
            <CardDescription>
              Aggiungi o modifica le pareti incluse nel preventivo
            </CardDescription>
          </div>
          <Button>
            <PlusCircle className="h-4 w-4 mr-2" />
            Aggiungi parete
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipologia</TableHead>
                <TableHead>Superficie (mq)</TableHead>
                <TableHead className="text-right">Prezzo/mq</TableHead>
                <TableHead className="text-right">Totale</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Parete divisoria P01</TableCell>
                <TableCell>Parete singola</TableCell>
                <TableCell>24.5</TableCell>
                <TableCell className="text-right">€ 38.50</TableCell>
                <TableCell className="text-right font-medium">€ 943.25</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Controparete CP02</TableCell>
                <TableCell>Controparete</TableCell>
                <TableCell>18.2</TableCell>
                <TableCell className="text-right">€ 26.75</TableCell>
                <TableCell className="text-right font-medium">€ 486.85</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Controsoffitto CS01</TableCell>
                <TableCell>Controsoffitto</TableCell>
                <TableCell>32.0</TableCell>
                <TableCell className="text-right">€ 42.00</TableCell>
                <TableCell className="text-right font-medium">€ 1,344.00</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={3} className="text-right font-medium">Totale materiali</TableCell>
                <TableCell className="text-right font-medium">€ 35.80</TableCell>
                <TableCell className="text-right font-medium">€ 2,774.10</TableCell>
                <TableCell></TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={3} className="text-right font-medium">Manodopera</TableCell>
                <TableCell className="text-right font-medium">-</TableCell>
                <TableCell className="text-right font-medium">€ 1,850.00</TableCell>
                <TableCell></TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={3} className="text-right font-medium">Totale preventivo</TableCell>
                <TableCell className="text-right font-medium">-</TableCell>
                <TableCell className="text-right font-bold text-construction-primary">€ 4,624.10</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Documenti</CardTitle>
            <CardDescription>
              Aggiungi documenti allegati al preventivo
            </CardDescription>
          </div>
          <Button variant="outline">
            <FileUp className="h-4 w-4 mr-2" />
            Carica documento
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center">
                <FileText className="h-5 w-5 mr-3 text-construction-primary" />
                <div>
                  <p className="font-medium">Preventivo_v1.pdf</p>
                  <p className="text-xs text-muted-foreground">PDF, 2.4 MB - Caricato il 15/03/2023</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">Visualizza</Button>
                <Button variant="outline" size="sm" className="text-destructive">Elimina</Button>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center">
                <FilePlus className="h-5 w-5 mr-3 text-construction-primary" />
                <div>
                  <p className="font-medium">Scheda_tecnica_BA13.pdf</p>
                  <p className="text-xs text-muted-foreground">PDF, 1.8 MB - Caricato il 12/03/2023</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">Visualizza</Button>
                <Button variant="outline" size="sm" className="text-destructive">Elimina</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end gap-4">
        <Button variant="outline">Annulla</Button>
        <Button variant="outline">Salva bozza</Button>
        <Button>Salva e invia</Button>
      </div>
    </div>
  );
};

export default EstimateForm;

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, Building } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEstimate } from '@/hooks/useEstimate';
import { useProject } from '@/hooks/useProject';

interface EstimateInfoCardProps {
  estimateId: string;
}

const EstimateInfoCard = ({ estimateId }: EstimateInfoCardProps) => {
  const navigate = useNavigate();
  const { estimate } = useEstimate(estimateId);
  const { project } = useProject(estimate?.projectId || '');

  if (!estimate) return null;

  return (
    <Card className="mb-6 bg-blue-50 border-blue-200">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">Configurazione per preventivo</CardTitle>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate(`/estimates/${estimateId}/manage`)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Torna al preventivo
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-gray-500" />
              <span className="font-medium">Preventivo:</span>
              <Badge variant="outline">{estimate.name}</Badge>
            </div>
            {estimate.description && (
              <p className="text-sm text-gray-600 ml-6">{estimate.description}</p>
            )}
          </div>
          
          {project && (
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-gray-500" />
              <span className="font-medium">Progetto:</span>
              <span className="text-sm">{project.name}</span>
              {project.client && (
                <>
                  <span className="text-gray-400">•</span>
                  <span className="text-sm text-gray-600">{project.client}</span>
                </>
              )}
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
              Le stratigrafie configurate verranno aggiunte a questo preventivo
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EstimateInfoCard;

import { useState, useEffect } from 'react';
import { ProjectVersion, projectsApi } from '@/lib/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface VersionSelectorProps {
  projectSlug: string;
  onVersionChange: (version: ProjectVersion) => void;
  defaultVersionId?: number;
  label?: string;
}

export function VersionSelector({ 
  projectSlug, 
  onVersionChange, 
  defaultVersionId,
  label = 'Version'
}: VersionSelectorProps) {
  const [versions, setVersions] = useState<ProjectVersion[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string | undefined>(
    defaultVersionId ? String(defaultVersionId) : undefined
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchVersions = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await projectsApi.listVersions(projectSlug);
        setVersions(response);
        
        // Eğer default versiyon ID'si belirtilmişse onu seç
        if (response.length > 0) {
          let versionToSelect: ProjectVersion | undefined;
          
          if (defaultVersionId) {
            versionToSelect = response.find(v => v.id === defaultVersionId);
          } else {
            // Default ID yoksa, label'a göre farklı seçim yap
            if (label === "Old Version" && response.length > 1) {
              // Old Version için sondan bir önceki versiyonu seç
              versionToSelect = response[1]; // response en yeniden eskiye sıralı olduğundan, 1. indeks sondan bir önceki
            } else {
              // New Version veya diğer durumlar için en son versiyonu seç
              versionToSelect = response[0];
            }
          }
            
          if (versionToSelect) {
            setSelectedVersionId(String(versionToSelect.id));
            onVersionChange(versionToSelect);
          }
        }
      } catch (error: any) {
        console.error('Error fetching versions:', error);
        setError('Failed to load versions');
        setVersions([]);
      } finally {
        setLoading(false);
      }
    };
    
    if (projectSlug) {
      fetchVersions();
    }
  }, [projectSlug, defaultVersionId, onVersionChange]);
  
  const handleVersionChange = (versionId: string) => {
    setSelectedVersionId(versionId);
    const version = versions.find(v => v.id.toString() === versionId);
    if (version) {
      onVersionChange(version);
    }
  };
  
  if (error) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <Skeleton className="h-10 w-[200px]" />
      </div>
    );
  }
  
  if (versions.length === 0) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="text-sm text-muted-foreground">No versions available</div>
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={selectedVersionId} onValueChange={handleVersionChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select version" />
        </SelectTrigger>
        <SelectContent>
          {versions.map(version => (
            <SelectItem key={version.id} value={version.id.toString()}>
              {version.versionName} - {new Date(version.createdAt).toLocaleDateString()}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
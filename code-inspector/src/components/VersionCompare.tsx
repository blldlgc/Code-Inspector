import { useState, useEffect } from 'react';
import { ProjectVersion, FileDiff, projectsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { VersionSelector } from '@/components/VersionSelector';
import { Badge } from '@/components/ui/badge';

interface VersionCompareProps {
  projectSlug: string;
  defaultOldVersionId?: number;
  defaultNewVersionId?: number;
}

export function VersionCompare({ 
  projectSlug,
  defaultOldVersionId,
  defaultNewVersionId
}: VersionCompareProps) {
  const [oldVersion, setOldVersion] = useState<ProjectVersion | null>(null);
  const [newVersion, setNewVersion] = useState<ProjectVersion | null>(null);
  const [diffs, setDiffs] = useState<FileDiff[]>([]);
  const [loading, setLoading] = useState(false);
  
  const fetchDiff = async () => {
    if (!oldVersion || !newVersion) return;
    
    try {
      setLoading(true);
      const response = await projectsApi.getDiff(
        projectSlug, 
        oldVersion.id, 
        newVersion.id
      );
      setDiffs(response);
    } catch (error) {
      console.error('Error fetching diff:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (oldVersion && newVersion) {
      fetchDiff();
    }
  }, [oldVersion, newVersion]);
  
  const getChangeTypeColor = (changeType: string) => {
    switch (changeType) {
      case 'ADD':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'DELETE':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'MODIFY':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'RENAME':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'COPY':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Compare Versions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <VersionSelector 
              projectSlug={projectSlug}
              onVersionChange={setOldVersion}
              defaultVersionId={defaultOldVersionId}
              label="Old Version"
            />
          </div>
          <div>
            <VersionSelector 
              projectSlug={projectSlug}
              onVersionChange={setNewVersion}
              defaultVersionId={defaultNewVersionId}
              label="New Version"
            />
          </div>
        </div>
        
        {oldVersion && newVersion && (
          <Button 
            onClick={fetchDiff} 
            disabled={loading}
            className="mb-4"
          >
            {loading ? 'Loading...' : 'Compare'}
          </Button>
        )}
        
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[200px] w-full" />
          </div>
        ) : diffs.length === 0 ? (
          <div className="text-center p-4 text-muted-foreground">
            {oldVersion && newVersion 
              ? 'No differences found between these versions.' 
              : 'Select two versions to compare.'}
          </div>
        ) : (
          <div className="space-y-4">
            {diffs.map((diff, index) => (
              <div key={index} className="border rounded overflow-hidden">
                <div className="flex items-center justify-between bg-muted p-2">
                  <div className="font-medium">{diff.path}</div>
                  <Badge className={getChangeTypeColor(diff.changeType)}>
                    {diff.changeType}
                  </Badge>
                </div>
                <pre className="p-4 overflow-x-auto text-sm whitespace-pre-wrap bg-muted/30">
                  {formatDiff(diff.diff)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Diff formatını renklendir
function formatDiff(diffText: string): JSX.Element {
  const lines = diffText.split('\n');
  
  return (
    <>
      {lines.map((line, i) => {
        if (line.startsWith('+')) {
          return <div key={i} className="bg-green-100 dark:bg-green-900/30">{line}</div>;
        } else if (line.startsWith('-')) {
          return <div key={i} className="bg-red-100 dark:bg-red-900/30">{line}</div>;
        } else if (line.startsWith('@')) {
          return <div key={i} className="bg-blue-100 dark:bg-blue-900/30">{line}</div>;
        } else {
          return <div key={i}>{line}</div>;
        }
      })}
    </>
  );
}

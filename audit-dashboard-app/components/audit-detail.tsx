'use client';

import { AuditEntry } from '@/types/audit';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

interface AuditDetailProps {
  audit: AuditEntry;
  onClose: () => void;
}

export default function AuditDetail({ audit, onClose }: AuditDetailProps) {
  const getOperationColor = (action: string) => {
    switch (action?.toUpperCase()) {
      case 'CREATE':
        return 'text-green-600 dark:text-green-400';
      case 'UPDATE':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'DELETE':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Audit Record Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-xs text-muted-foreground uppercase mb-1">Action</div>
                <div className={`text-lg font-bold ${getOperationColor(audit.action)}`}>
                  {audit.action}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-xs text-muted-foreground uppercase mb-1">Status</div>
                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                  Success
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-xs text-muted-foreground uppercase mb-1">Timestamp</div>
                <div className="text-sm">
                  {new Date(audit.created_at).toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(audit.created_at), { addSuffix: true })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-xs text-muted-foreground uppercase mb-1">Entity ID</div>
                <div className="text-sm font-mono">{audit.entity_display_id || audit.entity_id}</div>
              </CardContent>
            </Card>
          </div>

          {/* Main Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Entity Type</label>
              <p className="text-sm mt-1">{audit.entity_type}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">User</label>
              <p className="text-sm mt-1">{audit.users?.name || 'Unknown'}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">User Email</label>
              <p className="text-sm mt-1">{audit.users?.email || 'Unknown'}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">User Role</label>
              <p className="text-sm mt-1">{audit.users?.role || 'Unknown'}</p>
            </div>
          </div>

          {/* Data Comparison */}
          <Tabs defaultValue="before" className="w-full">
            <TabsList>
              <TabsTrigger value="before">Before</TabsTrigger>
              <TabsTrigger value="after">After</TabsTrigger>
              <TabsTrigger value="diff">Changes</TabsTrigger>
            </TabsList>

            <TabsContent value="before" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  {audit.old_values ? (
                    <pre className="bg-muted p-4 rounded overflow-x-auto text-xs">
                      {JSON.stringify(audit.old_values, null, 2)}
                    </pre>
                  ) : (
                    <p className="text-sm text-muted-foreground">No previous value</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="after" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  {audit.new_values ? (
                    <pre className="bg-muted p-4 rounded overflow-x-auto text-xs">
                      {JSON.stringify(audit.new_values, null, 2)}
                    </pre>
                  ) : (
                    <p className="text-sm text-muted-foreground">No new value</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="diff" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Compare Before and After tabs to see changes</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Additional Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">ID</span>
                  <span className="font-mono">{audit.id}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">User ID</span>
                  <span className="font-mono">{audit.user_id}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

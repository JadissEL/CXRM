'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  Download, 
  Trash2, 
  Shield, 
  Clock, 
  CheckCircle, 
  XCircle,
  FileText,
  Mail,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface ExportInfo {
  canExport: boolean;
  recentExports: Array<{
    initiated_at: string;
    status: string;
    metadata: any;
  }>;
  rateLimits: {
    maxPerDay: number;
    currentCount: number;
    resetTime: string;
  };
  supportedFormats: string[];
  deliveryMethods: string[];
  dataIncluded: string[];
}

interface DeletionInfo {
  canDelete: boolean;
  requirements: Array<{
    requirement: string;
    met: boolean;
    description: string;
  }>;
  estimatedTime: string;
  dataToDelete: string[];
  irreversible: boolean;
}

/**
 * PrivacyControls Component
 * 
 * Provides GDPR-compliant data privacy controls including:
 * - Account deletion with cascade cleanup
 * - Data export in multiple formats
 * - Privacy audit logs
 * - Secure download management
 * 
 * Features:
 * - Real-time status updates
 * - Rate limiting protection
 * - Comprehensive error handling
 * - Educational tooltips and warnings
 */
export default function PrivacyControls() {
  const { user, isLoading } = useAuth();
  const [exportInfo, setExportInfo] = useState<ExportInfo | null>(null);
  const [deletionInfo, setDeletionInfo] = useState<DeletionInfo | null>(null);
  const [loading, setLoading] = useState({
    export: false,
    delete: false,
    fetchInfo: true
  });
  const [exportProgress, setExportProgress] = useState(0);
  const [deleteProgress, setDeleteProgress] = useState(0);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

  // Fetch privacy control information on component mount
  useEffect(() => {
    if (!isLoading && user) {
      fetchPrivacyInfo();
    }
  }, [isLoading, user]);

  /**
   * Fetches current privacy control status and capabilities
   */
  const fetchPrivacyInfo = async () => {
    try {
      setLoading(prev => ({ ...prev, fetchInfo: true }));
      
      // Fetch export information
      const exportResponse = await fetch('/api/profile/export-data');
      if (exportResponse.ok) {
        const exportData = await exportResponse.json();
        setExportInfo(exportData);
      }
      
      // Fetch deletion information
      const deleteResponse = await fetch('/api/profile/delete-account');
      if (deleteResponse.ok) {
        const deleteData = await deleteResponse.json();
        setDeletionInfo(deleteData);
      }
    } catch (error) {
      console.error('Failed to fetch privacy info:', error);
      toast.error('Failed to load privacy settings');
    } finally {
      setLoading(prev => ({ ...prev, fetchInfo: false }));
    }
  };

  /**
   * Handles data export request
   */
  const handleDataExport = async (format: 'json' | 'zip' = 'zip', deliveryMethod: 'download' | 'email' = 'download') => {
    if (!exportInfo?.canExport) {
      toast.error('Export not available. Rate limit exceeded.');
      return;
    }

    try {
      setLoading(prev => ({ ...prev, export: true }));
      setExportProgress(0);
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 20;
        });
      }, 500);

      const response = await fetch('/api/profile/export-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format,
          deliveryMethod,
          includeAuditLogs: true
        })
      });

      clearInterval(progressInterval);
      setExportProgress(100);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Export failed');
      }

      const result = await response.json();
      
      if (deliveryMethod === 'email') {
        toast.success('Data export sent to your email address');
      } else if (result.download_url) {
        // Trigger download
        window.open(result.download_url, '_blank');
        toast.success('Data export ready for download');
      } else if (result.data) {
        // Direct JSON download
        const blob = new Blob([JSON.stringify(result.data, null, 2)], {
          type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `data-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Data export downloaded');
      }
      
      // Refresh export info
      await fetchPrivacyInfo();
      
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error(error.message || 'Failed to export data');
    } finally {
      setLoading(prev => ({ ...prev, export: false }));
      setExportProgress(0);
    }
  };

  /**
   * Handles account deletion request
   */
  const handleAccountDeletion = async () => {
    if (!deletionInfo?.canDelete) {
      toast.error('Account deletion requirements not met');
      return;
    }

    if (deleteConfirmationText !== 'DELETE MY ACCOUNT') {
      toast.error('Please type "DELETE MY ACCOUNT" to confirm');
      return;
    }

    try {
      setLoading(prev => ({ ...prev, delete: true }));
      setDeleteProgress(0);
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setDeleteProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 15;
        });
      }, 1000);

      const response = await fetch('/api/profile/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confirmation: deleteConfirmationText
        })
      });

      clearInterval(progressInterval);
      setDeleteProgress(100);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Deletion failed');
      }

      const result = await response.json();
      
      toast.success('Account deletion initiated. You will be logged out shortly.');
      
      // Redirect after a short delay
      setTimeout(() => {
        window.location.href = '/sign-in?deleted=true';
      }, 3000);
      
    } catch (error: any) {
      console.error('Deletion error:', error);
      toast.error(error.message || 'Failed to delete account');
      setDeleteProgress(0);
    } finally {
      setLoading(prev => ({ ...prev, delete: false }));
    }
  };

  /**
   * Formats date for display
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  /**
   * Gets status badge variant based on status
   */
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'failed': return 'destructive';
      case 'in_progress': return 'secondary';
      default: return 'outline';
    }
  };

  if (isLoading || loading.fetchInfo) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading privacy controls...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          You must be signed in to access privacy controls.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <Shield className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Privacy Controls</h1>
      </div>
      
      <p className="text-muted-foreground">
        Manage your personal data and privacy settings. All actions are logged for security and compliance.
      </p>

      {/* Data Export Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Download className="h-5 w-5" />
            <span>Export My Data</span>
          </CardTitle>
          <CardDescription>
            Download all your personal data in a portable format (GDPR Article 20)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {exportInfo && (
            <>
              {/* Export Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Export Status:</span>
                <Badge variant={exportInfo.canExport ? 'default' : 'destructive'}>
                  {exportInfo.canExport ? 'Available' : 'Rate Limited'}
                </Badge>
              </div>
              
              {/* Rate Limits */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Daily Exports:</span>
                  <span>{exportInfo.rateLimits.currentCount} / {exportInfo.rateLimits.maxPerDay}</span>
                </div>
                <Progress 
                  value={(exportInfo.rateLimits.currentCount / exportInfo.rateLimits.maxPerDay) * 100} 
                  className="h-2"
                />
                {!exportInfo.canExport && (
                  <p className="text-xs text-muted-foreground">
                    Resets at: {formatDate(exportInfo.rateLimits.resetTime)}
                  </p>
                )}
              </div>
              
              {/* Data Included */}
              <div className="space-y-2">
                <span className="text-sm font-medium">Data Included:</span>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {exportInfo.dataIncluded.map((item, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <CheckCircle className="h-3 w-3" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Export Progress */}
              {loading.export && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Preparing your data export...</span>
                  </div>
                  <Progress value={exportProgress} className="h-2" />
                </div>
              )}
              
              {/* Export Buttons */}
              <div className="flex space-x-2">
                <Button
                  onClick={() => handleDataExport('zip', 'download')}
                  disabled={!exportInfo.canExport || loading.export}
                  className="flex items-center space-x-2"
                >
                  <FileText className="h-4 w-4" />
                  <span>Download ZIP</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDataExport('json', 'download')}
                  disabled={!exportInfo.canExport || loading.export}
                  className="flex items-center space-x-2"
                >
                  <FileText className="h-4 w-4" />
                  <span>Download JSON</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDataExport('zip', 'email')}
                  disabled={!exportInfo.canExport || loading.export}
                  className="flex items-center space-x-2"
                >
                  <Mail className="h-4 w-4" />
                  <span>Email ZIP</span>
                </Button>
              </div>
              
              {/* Recent Exports */}
              {exportInfo.recentExports.length > 0 && (
                <div className="space-y-2">
                  <span className="text-sm font-medium">Recent Exports:</span>
                  <div className="space-y-1">
                    {exportInfo.recentExports.slice(0, 3).map((exp, index) => (
                      <div key={index} className="flex items-center justify-between text-xs">
                        <span>{formatDate(exp.initiated_at)}</span>
                        <Badge variant={getStatusVariant(exp.status)} className="text-xs">
                          {exp.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Account Deletion Section */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            <span>Delete My Account</span>
          </CardTitle>
          <CardDescription>
            Permanently delete your account and all associated data (GDPR Article 17)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {deletionInfo && (
            <>
              {/* Deletion Requirements */}
              <div className="space-y-2">
                <span className="text-sm font-medium">Requirements:</span>
                <div className="space-y-1">
                  {deletionInfo.requirements.map((req, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      {req.met ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className={req.met ? 'text-green-700' : 'text-red-700'}>
                        {req.requirement}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Data to Delete */}
              <div className="space-y-2">
                <span className="text-sm font-medium">Data to be deleted:</span>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {deletionInfo.dataToDelete.map((item, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <Trash2 className="h-3 w-3" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Warning */}
              <Alert className="border-destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>This action is irreversible!</strong> All your data will be permanently deleted 
                  and cannot be recovered. Estimated processing time: {deletionInfo.estimatedTime}.
                </AlertDescription>
              </Alert>
              
              {/* Deletion Progress */}
              {loading.delete && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Deleting your account...</span>
                  </div>
                  <Progress value={deleteProgress} className="h-2" />
                </div>
              )}
              
              {/* Deletion Confirmation */}
              {!showDeleteConfirmation ? (
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteConfirmation(true)}
                  disabled={!deletionInfo.canDelete || loading.delete}
                  className="w-full"
                >
                  Delete My Account
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Type "DELETE MY ACCOUNT" to confirm:
                    </label>
                    <input
                      type="text"
                      value={deleteConfirmationText}
                      onChange={(e) => setDeleteConfirmationText(e.target.value)}
                      className="w-full px-3 py-2 border border-destructive rounded-md focus:outline-none focus:ring-2 focus:ring-destructive"
                      placeholder="DELETE MY ACCOUNT"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="destructive"
                      onClick={handleAccountDeletion}
                      disabled={deleteConfirmationText !== 'DELETE MY ACCOUNT' || loading.delete}
                      className="flex-1"
                    >
                      Confirm Deletion
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowDeleteConfirmation(false);
                        setDeleteConfirmationText('');
                      }}
                      disabled={loading.delete}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Privacy Notice */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Privacy Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            • All privacy actions are logged for security and compliance purposes
          </p>
          <p>
            • Data exports include all personal information we have about you
          </p>
          <p>
            • Account deletion is permanent and cannot be undone
          </p>
          <p>
            • For questions about your data, contact our privacy team
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
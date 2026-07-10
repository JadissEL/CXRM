import React from 'react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '../components/ui/dialog';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '../components/ui/alert-dialog';
import { 
  Download, 
  Trash2, 
  FileText, 
  Shield, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';
import { privacyAPI } from '../../shared/api';

const deletionSchema = z.object({
  reason: z.string().optional(),
});

type DeletionFormData = z.infer<typeof deletionSchema>;

const PrivacyControls: React.FC = () => {
  const queryClient = useQueryClient();
  const [isDeletionDialogOpen, setIsDeletionDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const deletionForm = useForm<DeletionFormData>({
    resolver: zodResolver(deletionSchema),
    defaultValues: {
      reason: '',
    },
  });

  // Fetch user privacy data
  const { data: privacyData, isLoading } = useQuery({
    queryKey: ['privacy-data'],
    queryFn: privacyAPI.getUserPrivacyData,
  });

  // Fetch privacy policy version
  const { data: policyVersion } = useQuery({
    queryKey: ['privacy-policy'],
    queryFn: privacyAPI.getPolicyVersion,
  });

  // Request data export
  const exportMutation = useMutation({
    mutationFn: privacyAPI.requestDataExport,
    onSuccess: () => {
      toast.success('Demande d\'export créée avec succès');
      queryClient.invalidateQueries({ queryKey: ['privacy-data'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de la demande d\'export');
    },
  });

  // Request account deletion
  const deletionMutation = useMutation({
    mutationFn: privacyAPI.requestAccountDeletion,
    onSuccess: () => {
      toast.success('Demande de suppression créée avec succès');
      setIsDeletionDialogOpen(false);
      deletionForm.reset();
      queryClient.invalidateQueries({ queryKey: ['privacy-data'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de la demande de suppression');
    },
  });

  // Cancel account deletion
  const cancelDeletionMutation = useMutation({
    mutationFn: privacyAPI.cancelAccountDeletion,
    onSuccess: () => {
      toast.success('Demande de suppression annulée avec succès');
      queryClient.invalidateQueries({ queryKey: ['privacy-data'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de l\'annulation');
    },
  });

  // Update consent
  const consentMutation = useMutation({
    mutationFn: privacyAPI.updateConsent,
    onSuccess: () => {
      toast.success('Préférences mises à jour');
      queryClient.invalidateQueries({ queryKey: ['privacy-data'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de la mise à jour');
    },
  });

  const handleExport = (requestType: string) => {
    exportMutation.mutate({ requestType });
  };

  const handleDeletion = (data: DeletionFormData) => {
    deletionMutation.mutate({ reason: data.reason });
  };

  const handleCancelDeletion = () => {
    cancelDeletionMutation.mutate();
  };

  const handleConsentChange = (consentType: string, granted: boolean) => {
    if (!policyVersion) return;
    
    consentMutation.mutate({
      consentType,
      granted,
      version: policyVersion.version,
    });
  };

  const getConsentStatus = (consentType: string) => {
    if (!privacyData?.consents) return null;
    const latestConsent = privacyData.consents.find(c => c.consent_type === consentType);
    return latestConsent?.granted ?? null;
  };

  const getExportStatus = (exportId: number) => {
    if (!privacyData?.exportRequests) return null;
    return privacyData.exportRequests.find(e => e.id === exportId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Contrôles de confidentialité</h1>
          <p className="text-muted-foreground">
            Gérez vos données personnelles et vos préférences de confidentialité
          </p>
        </div>

        <Tabs defaultValue="export" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="export" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export de données
            </TabsTrigger>
            <TabsTrigger value="deletion" className="flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              Suppression de compte
            </TabsTrigger>
            <TabsTrigger value="consent" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Consentements
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Historique
            </TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Export de vos données</CardTitle>
                <CardDescription>
                  Téléchargez une copie de vos données personnelles au format JSON
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Export complet</CardTitle>
                      <CardDescription>
                        Toutes vos données : profil, rendez-vous, avis, favoris
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        onClick={() => handleExport('full')}
                        disabled={exportMutation.isPending}
                        className="w-full"
                      >
                        {exportMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Exporter toutes mes données
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Export du profil</CardTitle>
                      <CardDescription>
                        Vos informations personnelles et adresses
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        onClick={() => handleExport('profile')}
                        disabled={exportMutation.isPending}
                        variant="outline"
                        className="w-full"
                      >
                        Exporter mon profil
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Export des rendez-vous</CardTitle>
                      <CardDescription>
                        Historique de tous vos rendez-vous
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        onClick={() => handleExport('appointments')}
                        disabled={exportMutation.isPending}
                        variant="outline"
                        className="w-full"
                      >
                        Exporter mes rendez-vous
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Export des avis</CardTitle>
                      <CardDescription>
                        Tous vos avis et commentaires
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        onClick={() => handleExport('reviews')}
                        disabled={exportMutation.isPending}
                        variant="outline"
                        className="w-full"
                      >
                        Exporter mes avis
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {privacyData?.exportRequests && privacyData.exportRequests.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Mes demandes d'export</h3>
                    <div className="space-y-2">
                      {privacyData.exportRequests.map((exportReq) => (
                        <div key={exportReq.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            {exportReq.status === 'completed' && <CheckCircle className="h-5 w-5 text-green-500" />}
                            {exportReq.status === 'pending' && <Clock className="h-5 w-5 text-yellow-500" />}
                            {exportReq.status === 'processing' && <Loader2 className="h-5 w-5 animate-spin text-blue-500" />}
                            {exportReq.status === 'failed' && <XCircle className="h-5 w-5 text-red-500" />}
                            
                            <div>
                              <p className="font-medium">
                                Export {exportReq.request_type} - {exportReq.status}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Demandé le {new Date(exportReq.created_at).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                          </div>
                          
                          {exportReq.status === 'completed' && exportReq.file_path && (
                            <Button
                              onClick={() => window.open(`/api/privacy/export/${exportReq.id}/download`)}
                              size="sm"
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Télécharger
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deletion" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Suppression de compte</CardTitle>
                <CardDescription>
                  Demandez la suppression définitive de votre compte et de toutes vos données
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {privacyData?.deletionRequest && privacyData.deletionRequest.status === 'pending' ? (
                  <div className="space-y-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        <h3 className="font-semibold text-yellow-800">Demande de suppression en cours</h3>
                      </div>
                      <p className="text-yellow-700 mt-2">
                        Votre compte sera supprimé le {new Date(privacyData.deletionRequest.scheduled_for).toLocaleDateString('fr-FR')}
                      </p>
                      {privacyData.deletionRequest.reason && (
                        <p className="text-yellow-700 mt-2">
                          <strong>Raison :</strong> {privacyData.deletionRequest.reason}
                        </p>
                      )}
                    </div>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                          Annuler la demande de suppression
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Annuler la suppression</AlertDialogTitle>
                          <AlertDialogDescription>
                            Êtes-vous sûr de vouloir annuler la demande de suppression de votre compte ?
                            Votre compte restera actif et vos données seront conservées.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction onClick={handleCancelDeletion}>
                            Confirmer l'annulation
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <h3 className="font-semibold text-red-800">Attention</h3>
                      </div>
                      <p className="text-red-700 mt-2">
                        La suppression de votre compte est irréversible. Toutes vos données seront définitivement supprimées.
                      </p>
                    </div>

                    <Dialog open={isDeletionDialogOpen} onOpenChange={setIsDeletionDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="destructive" className="w-full">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Demander la suppression de mon compte
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Demande de suppression de compte</DialogTitle>
                          <DialogDescription>
                            Votre compte sera supprimé dans 30 jours. Vous pouvez annuler cette demande à tout moment.
                          </DialogDescription>
                        </DialogHeader>
                        
                        <form onSubmit={deletionForm.handleSubmit(handleDeletion)} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="reason">Raison (optionnel)</Label>
                            <Controller
                              name="reason"
                              control={deletionForm.control}
                              render={({ field }) => (
                                <Textarea
                                  {...field}
                                  placeholder="Pourquoi souhaitez-vous supprimer votre compte ?"
                                  rows={3}
                                />
                              )}
                            />
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsDeletionDialogOpen(false)}
                              className="flex-1"
                            >
                              Annuler
                            </Button>
                            <Button
                              type="submit"
                              variant="destructive"
                              disabled={deletionMutation.isPending}
                              className="flex-1"
                            >
                              {deletionMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              Confirmer la suppression
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="consent" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Gestion des consentements</CardTitle>
                <CardDescription>
                  Contrôlez comment nous utilisons vos données
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {policyVersion?.consentTypes?.map((consentType) => (
                  <div key={consentType.type} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold">{consentType.title}</h3>
                      <p className="text-sm text-muted-foreground">{consentType.description}</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant={getConsentStatus(consentType.type) ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleConsentChange(consentType.type, true)}
                        disabled={consentMutation.isPending}
                      >
                        Accepter
                      </Button>
                      <Button
                        variant={getConsentStatus(consentType.type) === false ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleConsentChange(consentType.type, false)}
                        disabled={consentMutation.isPending}
                      >
                        Refuser
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Historique des accès aux données</CardTitle>
                <CardDescription>
                  Consultez l'historique de vos actions liées à vos données
                </CardDescription>
              </CardHeader>
              <CardContent>
                {privacyData?.accessLogs && privacyData.accessLogs.length > 0 ? (
                  <div className="space-y-2">
                    {privacyData.accessLogs.map((log) => (
                      <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">
                            {log.action === 'export' && 'Export de données'}
                            {log.action === 'delete_request' && 'Demande de suppression'}
                            {log.action === 'consent_change' && 'Modification de consentement'}
                            {log.action === 'view' && 'Consultation de données'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(log.created_at).toLocaleString('fr-FR')}
                          </p>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {log.data_type}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Aucun historique d'accès aux données
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PrivacyControls; 
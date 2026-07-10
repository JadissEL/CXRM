import React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ArrowLeft, Mail, Phone, Loader2, CheckCircle } from 'lucide-react';
import { authAPI } from '../../shared/api';

const emailSchema = z.object({
  email: z.string().email('Email invalide'),
});

const phoneSchema = z.object({
  phone: z.string().min(10, 'Numéro de téléphone invalide'),
});

type EmailFormData = z.infer<typeof emailSchema>;
type PhoneFormData = z.infer<typeof phoneSchema>;

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [recoveryMethod, setRecoveryMethod] = useState<'email' | 'sms'>('email');
  const [isSuccess, setIsSuccess] = useState(false);

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: '',
    },
  });

  const phoneForm = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      phone: '',
    },
  });

  const forgotPasswordEmailMutation = useMutation({
    mutationFn: authAPI.forgotPassword,
    onSuccess: () => {
      setIsSuccess(true);
      toast.success('Email de réinitialisation envoyé');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de l\'envoi de l\'email');
    },
  });

  const forgotPasswordSMSMutation = useMutation({
    mutationFn: authAPI.forgotPasswordSMS,
    onSuccess: () => {
      setIsSuccess(true);
      toast.success('SMS de réinitialisation envoyé');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de l\'envoi du SMS');
    },
  });

  const onSubmitEmail = (data: EmailFormData) => {
    forgotPasswordEmailMutation.mutate(data.email);
  };

  const onSubmitPhone = (data: PhoneFormData) => {
    forgotPasswordSMSMutation.mutate(data.phone);
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  const handleResetPassword = () => {
    navigate('/reset-password');
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Email envoyé !</CardTitle>
            <CardDescription>
              {recoveryMethod === 'email' 
                ? 'Nous avons envoyé un lien de réinitialisation à votre adresse email.'
                : 'Nous avons envoyé un code de réinitialisation à votre numéro de téléphone.'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground text-center">
              {recoveryMethod === 'email' ? (
                <p>
                  Vérifiez votre boîte de réception et cliquez sur le lien pour réinitialiser votre mot de passe.
                  Le lien expire dans 10 minutes.
                </p>
              ) : (
                <p>
                  Vérifiez vos messages SMS et utilisez le code reçu pour réinitialiser votre mot de passe.
                  Le code expire dans 10 minutes.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Button 
                onClick={handleResetPassword} 
                className="w-full"
              >
                Réinitialiser le mot de passe
              </Button>
              <Button 
                variant="outline" 
                onClick={handleBackToLogin} 
                className="w-full"
              >
                Retour à la connexion
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToLogin}
            className="mb-2 w-fit"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
          <CardTitle className="text-2xl">Mot de passe oublié ?</CardTitle>
          <CardDescription>
            Choisissez comment récupérer votre mot de passe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={recoveryMethod} onValueChange={(value) => setRecoveryMethod(value as 'email' | 'sms')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </TabsTrigger>
              <TabsTrigger value="sms" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                SMS
              </TabsTrigger>
            </TabsList>

            <TabsContent value="email" className="space-y-4 mt-6">
              <form onSubmit={emailForm.handleSubmit(onSubmitEmail)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Adresse email</Label>
                  <Controller
                    name="email"
                    control={emailForm.control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        type="email"
                        placeholder="votre@email.com"
                        disabled={forgotPasswordEmailMutation.isPending}
                      />
                    )}
                  />
                  {emailForm.formState.errors.email && (
                    <p className="text-sm text-red-500">
                      {emailForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={forgotPasswordEmailMutation.isPending}
                >
                  {forgotPasswordEmailMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Envoyer le lien de réinitialisation
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="sms" className="space-y-4 mt-6">
              <form onSubmit={phoneForm.handleSubmit(onSubmitPhone)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Numéro de téléphone</Label>
                  <Controller
                    name="phone"
                    control={phoneForm.control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        type="tel"
                        placeholder="+33 6 12 34 56 78"
                        disabled={forgotPasswordSMSMutation.isPending}
                      />
                    )}
                  />
                  {phoneForm.formState.errors.phone && (
                    <p className="text-sm text-red-500">
                      {phoneForm.formState.errors.phone.message}
                    </p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={forgotPasswordSMSMutation.isPending}
                >
                  {forgotPasswordSMSMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Envoyer le code SMS
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Vous vous souvenez de votre mot de passe ?{' '}
              <Button
                variant="link"
                className="p-0 h-auto text-sm"
                onClick={handleBackToLogin}
              >
                Se connecter
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword; 
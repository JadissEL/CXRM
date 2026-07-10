import React from 'react';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import { ArrowLeft, Mail, Phone, Loader2, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { authAPI } from '../../shared/api';

const resetPasswordSchema = z.object({
  email: z.string().email('Email invalide').optional(),
  phone: z.string().min(10, 'Numéro de téléphone invalide').optional(),
  code: z.string().min(6, 'Code requis'),
  newPassword: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  confirmPassword: z.string(),
}).refine((data) => {
  return data.email || data.phone;
}, {
  message: 'Email ou téléphone requis',
  path: ['email'],
}).refine((data) => {
  return data.newPassword === data.confirmPassword;
}, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [recoveryMethod, setRecoveryMethod] = useState<'email' | 'sms'>('email');
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Pre-fill email/phone from URL params if available
  const emailFromParams = searchParams.get('email');
  const phoneFromParams = searchParams.get('phone');

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: emailFromParams || '',
      phone: phoneFromParams || '',
      code: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: authAPI.resetPassword,
    onSuccess: () => {
      setIsSuccess(true);
      toast.success('Mot de passe réinitialisé avec succès');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de la réinitialisation');
    },
  });

  const verifyTokenMutation = useMutation({
    mutationFn: authAPI.verifyResetToken,
    onSuccess: () => {
      toast.success('Code vérifié avec succès');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Code invalide');
    },
  });

  const onSubmit = (data: ResetPasswordFormData) => {
    const resetData = {
      code: data.code,
      newPassword: data.newPassword,
      ...(data.email && { email: data.email }),
      ...(data.phone && { phone: data.phone }),
    };

    resetPasswordMutation.mutate(resetData);
  };

  const handleVerifyCode = () => {
    const email = form.getValues('email');
    const phone = form.getValues('phone');
    const code = form.getValues('code');

    if (!code) {
      toast.error('Veuillez entrer le code');
      return;
    }

    if (!email && !phone) {
      toast.error('Veuillez entrer votre email ou téléphone');
      return;
    }

    const verifyData = {
      code,
      ...(email && { email }),
      ...(phone && { phone }),
    };

    verifyTokenMutation.mutate(verifyData);
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  const handleBackToForgotPassword = () => {
    navigate('/forgot-password');
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Mot de passe réinitialisé !</CardTitle>
            <CardDescription>
              Votre mot de passe a été réinitialisé avec succès
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground text-center">
              <p>
                Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
              </p>
            </div>
            <Button 
              onClick={handleBackToLogin} 
              className="w-full"
            >
              Se connecter
            </Button>
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
            onClick={handleBackToForgotPassword}
            className="mb-2 w-fit"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
          <CardTitle className="text-2xl">Réinitialiser le mot de passe</CardTitle>
          <CardDescription>
            Entrez le code reçu et votre nouveau mot de passe
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
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Adresse email</Label>
                  <Controller
                    name="email"
                    control={form.control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        type="email"
                        placeholder="votre@email.com"
                        disabled={resetPasswordMutation.isPending}
                      />
                    )}
                  />
                  {form.formState.errors.email && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code">Code de réinitialisation</Label>
                  <div className="flex gap-2">
                    <Controller
                      name="code"
                      control={form.control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          placeholder="123456"
                          disabled={resetPasswordMutation.isPending}
                          className="flex-1"
                        />
                      )}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleVerifyCode}
                      disabled={verifyTokenMutation.isPending || resetPasswordMutation.isPending}
                    >
                      {verifyTokenMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Vérifier'
                      )}
                    </Button>
                  </div>
                  {form.formState.errors.code && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.code.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                  <div className="relative">
                    <Controller
                      name="newPassword"
                      control={form.control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Nouveau mot de passe"
                          disabled={resetPasswordMutation.isPending}
                        />
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {form.formState.errors.newPassword && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.newPassword.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                  <div className="relative">
                    <Controller
                      name="confirmPassword"
                      control={form.control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Confirmer le mot de passe"
                          disabled={resetPasswordMutation.isPending}
                        />
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {form.formState.errors.confirmPassword && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={resetPasswordMutation.isPending}
                >
                  {resetPasswordMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Réinitialiser le mot de passe
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="sms" className="space-y-4 mt-6">
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Numéro de téléphone</Label>
                  <Controller
                    name="phone"
                    control={form.control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        type="tel"
                        placeholder="+33 6 12 34 56 78"
                        disabled={resetPasswordMutation.isPending}
                      />
                    )}
                  />
                  {form.formState.errors.phone && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.phone.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code">Code SMS</Label>
                  <div className="flex gap-2">
                    <Controller
                      name="code"
                      control={form.control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          placeholder="123456"
                          disabled={resetPasswordMutation.isPending}
                          className="flex-1"
                        />
                      )}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleVerifyCode}
                      disabled={verifyTokenMutation.isPending || resetPasswordMutation.isPending}
                    >
                      {verifyTokenMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Vérifier'
                      )}
                    </Button>
                  </div>
                  {form.formState.errors.code && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.code.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                  <div className="relative">
                    <Controller
                      name="newPassword"
                      control={form.control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Nouveau mot de passe"
                          disabled={resetPasswordMutation.isPending}
                        />
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {form.formState.errors.newPassword && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.newPassword.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                  <div className="relative">
                    <Controller
                      name="confirmPassword"
                      control={form.control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Confirmer le mot de passe"
                          disabled={resetPasswordMutation.isPending}
                        />
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {form.formState.errors.confirmPassword && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={resetPasswordMutation.isPending}
                >
                  {resetPasswordMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Réinitialiser le mot de passe
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

export default ResetPassword; 
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/use-toast';
import { Loader2, CheckCircle, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = React.useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const token = searchParams.get('token');
    const provider = searchParams.get('provider');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setError(error);
      toast({
        title: "Erreur d'authentification",
        description: "Une erreur s'est produite lors de la connexion avec " + provider,
        variant: "destructive",
      });
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    if (!token) {
      setStatus('error');
      setError('Token manquant');
      toast({
        title: "Erreur d'authentification",
        description: "Token d'authentification manquant",
        variant: "destructive",
      });
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    try {
      // Decode the JWT token to get user info
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      // Store the token and user info
      login(token, payload.userId, payload.role);
      
      setStatus('success');
      toast({
        title: "Connexion réussie",
        description: `Bienvenue ! Vous êtes connecté avec ${provider}`,
      });

      // Redirect based on role
      const redirectPath = payload.role === 'admin' ? '/admin-dashboard' :
                          payload.role === 'barber' ? '/barber-dashboard' : '/client-dashboard';
      
      setTimeout(() => navigate(redirectPath), 2000);
    } catch (error) {
      setStatus('error');
      setError('Token invalide');
      toast({
        title: "Erreur d'authentification",
        description: "Token d'authentification invalide",
        variant: "destructive",
      });
      setTimeout(() => navigate('/login'), 3000);
    }
  }, [login, navigate, toast]);

  const getProviderName = (provider: string) => {
    switch (provider) {
      case 'google': return 'Google';
      case 'facebook': return 'Facebook';
      case 'apple': return 'Apple';
      default: return provider;
    }
  };

  const searchParams = new URLSearchParams(window.location.search);
  const provider = searchParams.get('provider');

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {status === 'loading' && 'Connexion en cours...'}
            {status === 'success' && 'Connexion réussie !'}
            {status === 'error' && 'Erreur de connexion'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status === 'loading' && (
            <>
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">
                Connexion avec {getProviderName(provider || '')}...
              </p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
              <p className="text-green-600 font-medium">
                Connexion réussie avec {getProviderName(provider || '')} !
              </p>
              <p className="text-sm text-muted-foreground">
                Redirection en cours...
              </p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <X className="h-12 w-12 mx-auto text-red-500" />
              <p className="text-red-600 font-medium">
                Erreur lors de la connexion
              </p>
              <p className="text-sm text-muted-foreground">
                {error}
              </p>
              <p className="text-sm text-muted-foreground">
                Redirection vers la page de connexion...
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 
import React from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Loader2, Phone, Mail, Eye, EyeOff } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

interface MFAComponentProps {
  userId: number;
  onSuccess: () => void;
  onCancel: () => void;
  type: 'setup' | 'verify';
  method?: 'email' | 'sms' | 'authenticator';
}

interface MFASetupResponse {
  secret?: string;
  qrCode?: string;
  otpauthUrl?: string;
  message?: string;
}

export const MFAComponent: React.FC<MFAComponentProps> = ({
  userId,
  onSuccess,
  onCancel,
  type,
  method = 'email'
}) => {
  const [selectedMethod, setSelectedMethod] = React.useState(method);
  const [code, setCode] = React.useState('');
  const [secret, setSecret] = React.useState('');
  const [qrCode, setQrCode] = React.useState('');
  const [otpauthUrl, setOtpauthUrl] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [showSecret, setShowSecret] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    if (type === 'setup' && selectedMethod === 'authenticator') {
      setupAuthenticator();
    }
  }, [selectedMethod, type]);

  const setupAuthenticator = async () => {
    try {
      setIsLoading(true);
      setError('');

      const response = await fetch('/api/auth/mfa/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          method: 'authenticator'
        }),
      });

      const data: MFASetupResponse = await response.json();

      if (response.ok) {
        setSecret(data.secret || '');
        setQrCode(data.qrCode || '');
        setOtpauthUrl(data.otpauthUrl || '');
      } else {
        setError(data.message || 'Erreur lors de la configuration');
      }
    } catch (error) {
      setError('Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetup = async () => {
    try {
      setIsLoading(true);
      setError('');

      const response = await fetch('/api/auth/mfa/enable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          method: selectedMethod,
          code,
          secret: selectedMethod === 'authenticator' ? secret : undefined
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "MFA activé",
          description: "L'authentification à deux facteurs a été activée avec succès.",
        });
        onSuccess();
      } else {
        setError(data.error || 'Erreur lors de l\'activation');
      }
    } catch (error) {
      setError('Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    try {
      setIsLoading(true);
      setError('');

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mfaCode: code
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess();
      } else {
        setError(data.error || 'Code invalide');
      }
    } catch (error) {
      setError('Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendCode = async () => {
    try {
      setIsLoading(true);
      setError('');

      const response = await fetch('/api/auth/mfa/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          method: selectedMethod
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Code envoyé",
          description: `Le code a été envoyé par ${selectedMethod === 'email' ? 'email' : 'SMS'}.`,
        });
      } else {
        setError(data.error || 'Erreur lors de l\'envoi du code');
      }
    } catch (error) {
      setError('Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copié",
      description: "Le secret a été copié dans le presse-papiers.",
    });
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          {type === 'setup' ? 'Configuration MFA' : 'Vérification MFA'}
        </CardTitle>
        <CardDescription>
          {type === 'setup' 
            ? 'Configurez l\'authentification à deux facteurs pour sécuriser votre compte'
            : 'Entrez le code de vérification pour continuer'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        {type === 'setup' && (
          <Tabs value={selectedMethod} onValueChange={setSelectedMethod}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </TabsTrigger>
              <TabsTrigger value="sms" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                SMS
              </TabsTrigger>
              <TabsTrigger value="authenticator" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                App
              </TabsTrigger>
            </TabsList>

            <TabsContent value="email" className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Un code de vérification sera envoyé à votre adresse email.
              </div>
              <Button 
                onClick={handleSendCode} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Envoyer le code par email
              </Button>
            </TabsContent>

            <TabsContent value="sms" className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Un code de vérification sera envoyé par SMS.
              </div>
              <Button 
                onClick={handleSendCode} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Envoyer le code par SMS
              </Button>
            </TabsContent>

            <TabsContent value="authenticator" className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Scannez le QR code avec votre application d'authentification.
              </div>
              
              {qrCode && (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <img src={qrCode} alt="QR Code" className="border rounded-lg" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Secret manuel (si le QR code ne fonctionne pas)</Label>
                    <div className="flex gap-2">
                      <Input
                        type={showSecret ? "text" : "password"}
                        value={secret}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setShowSecret(!showSecret)}
                      >
                        {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => copyToClipboard(secret)}
                      >
                        Copier
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        <div className="space-y-2">
          <Label htmlFor="code">
            {selectedMethod === 'authenticator' ? 'Code de l\'application' : 'Code de vérification'}
          </Label>
          <Input
            id="code"
            type="text"
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={6}
            className="text-center text-lg font-mono tracking-widest"
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={type === 'setup' ? handleSetup : handleVerify}
            disabled={isLoading || !code}
            className="flex-1"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {type === 'setup' ? 'Activer MFA' : 'Vérifier'}
          </Button>
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Annuler
          </Button>
        </div>

        {type === 'setup' && selectedMethod !== 'authenticator' && (
          <Button
            variant="ghost"
            onClick={handleSendCode}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Renvoyer le code
          </Button>
        )}
      </CardContent>
    </Card>
  );
}; 
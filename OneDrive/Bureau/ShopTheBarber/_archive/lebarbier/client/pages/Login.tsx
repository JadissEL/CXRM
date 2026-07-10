import React from "react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Scissors, Eye, EyeOff, Mail, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { MFAComponent } from "../components/MFAComponent";
import { useToast } from "../hooks/use-toast";
import SocialSignIn from "../components/SocialSignIn";

export default function Login() {
  const [formData, setFormData] = React.useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [mfaRequired, setMfaRequired] = React.useState(false);
  const [mfaUserId, setMfaUserId] = React.useState<number | null>(null);
  const [mfaMethod, setMfaMethod] = React.useState<'email' | 'sms' | 'authenticator'>('email');
  const [socialLoading, setSocialLoading] = React.useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLoading) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.mfaRequired) {
          // MFA is required
          setMfaRequired(true);
          setMfaUserId(data.userId);
          setMfaMethod(data.mfaMethod || 'email');
          toast({
            title: "Vérification requise",
            description: "Veuillez entrer le code de vérification envoyé par " + (data.mfaMethod === 'email' ? 'email' : 'SMS'),
          });
        } else {
          // Login successful
          login(data.accessToken, data.userId, data.role);
          toast({
            title: "Connexion réussie",
            description: `Bienvenue ${data.user.firstName} !`,
          });
          
          // Redirect based on role
          const redirectPath = data.role === 'admin' ? '/admin-dashboard' :
                              data.role === 'barber' ? '/barber-dashboard' : '/client-dashboard';
          navigate(redirectPath);
        }
      } else {
        setError(data.error || "Erreur de connexion");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      setError("Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMFASuccess = () => {
    setMfaRequired(false);
    toast({
      title: "Connexion réussie",
      description: "Authentification à deux facteurs validée !",
    });
    
    // Redirect to dashboard
    navigate('/client-dashboard');
  };

  const handleMFACancel = () => {
    setMfaRequired(false);
    setMfaUserId(null);
  };

  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  // Social sign-in handlers
  const handleGoogleSignIn = () => {
    setSocialLoading(true);
    window.location.href = '/api/auth/google';
  };

  const handleFacebookSignIn = () => {
    setSocialLoading(true);
    window.location.href = '/api/auth/facebook';
  };

  const handleAppleSignIn = () => {
    setSocialLoading(true);
    window.location.href = '/api/auth/apple';
  };

  if (mfaRequired && mfaUserId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <MFAComponent
          userId={mfaUserId}
          onSuccess={handleMFASuccess}
          onCancel={handleMFACancel}
          type="verify"
          method={mfaMethod}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <Scissors className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Connexion</CardTitle>
          <CardDescription>
            Connectez-vous à votre compte ShopTheBarber
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                <p className="text-destructive text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 h-6 w-6"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Votre mot de passe"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="pr-10"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto text-sm"
                onClick={handleForgotPassword}
                disabled={isLoading}
              >
                Mot de passe oublié ?
              </Button>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Se connecter
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Pas encore de compte ?{" "}
              <Link
                to="/signup"
                className="text-primary hover:underline font-medium"
              >
                Créer un compte
              </Link>
            </div>
          </form>

          <SocialSignIn
            onGoogleSignIn={handleGoogleSignIn}
            onFacebookSignIn={handleFacebookSignIn}
            onAppleSignIn={handleAppleSignIn}
            isLoading={socialLoading}
            disabled={isLoading}
          />

          <div className="mt-6 pt-6 border-t">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-3">
                Connexion sécurisée avec authentification à deux facteurs
              </p>
                             <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                 <Mail className="h-3 w-3" />
                 <span>Protection SSL/TLS</span>
               </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

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
import { Scissors, Eye, EyeOff, Mail, User, Phone, MapPin, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { MFAComponent } from "../components/MFAComponent";
import { useToast } from "../hooks/use-toast";

export default function Signup() {
  const [formData, setFormData] = React.useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    city: "",
    address: "",
    role: "client",
  });
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [mfaSetup, setMfaSetup] = React.useState(false);
  const [mfaUserId, setMfaUserId] = React.useState<number | null>(null);
  
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleRoleSelect = (role: string) => {
    setFormData({ ...formData, role });
    setError("");
  };

  const validatePassword = (password: string): string[] => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const errors: string[] = [];
    if (password.length < minLength) {
      errors.push(`Le mot de passe doit contenir au moins ${minLength} caractères`);
    }
    if (!hasUpperCase) {
      errors.push('Le mot de passe doit contenir au moins une majuscule');
    }
    if (!hasLowerCase) {
      errors.push('Le mot de passe doit contenir au moins une minuscule');
    }
    if (!hasNumbers) {
      errors.push('Le mot de passe doit contenir au moins un chiffre');
    }
    if (!hasSpecialChar) {
      errors.push('Le mot de passe doit contenir au moins un caractère spécial');
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLoading) return;

    // Validate passwords
    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    const passwordErrors = validatePassword(formData.password);
    if (passwordErrors.length > 0) {
      setError(passwordErrors.join(', '));
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          city: formData.city,
          address: formData.address,
          role: formData.role,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Registration successful
        login(data.accessToken, data.userId, data.role);
        setMfaUserId(data.userId);
        setMfaSetup(true);
        
        toast({
          title: "Inscription réussie",
          description: "Configurez maintenant l'authentification à deux facteurs pour sécuriser votre compte.",
        });
      } else {
        setError(data.error || "Erreur lors de l'inscription");
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      setError("Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMFASuccess = () => {
    setMfaSetup(false);
    toast({
      title: "Compte sécurisé",
      description: "Votre compte est maintenant protégé par l'authentification à deux facteurs !",
    });
    
    // Redirect based on role
    const redirectPath = formData.role === 'admin' ? '/admin-dashboard' :
                        formData.role === 'barber' ? '/barber-dashboard' : '/client-dashboard';
    navigate(redirectPath);
  };

  const handleMFACancel = () => {
    setMfaSetup(false);
    setMfaUserId(null);
    toast({
      title: "MFA ignoré",
      description: "Vous pouvez configurer l'authentification à deux facteurs plus tard dans vos paramètres.",
    });
    
    // Redirect based on role
    const redirectPath = formData.role === 'admin' ? '/admin-dashboard' :
                        formData.role === 'barber' ? '/barber-dashboard' : '/client-dashboard';
    navigate(redirectPath);
  };

  if (mfaSetup && mfaUserId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <MFAComponent
          userId={mfaUserId}
          onSuccess={handleMFASuccess}
          onCancel={handleMFACancel}
          type="setup"
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
          <CardTitle className="text-2xl font-bold">Créer un compte</CardTitle>
          <CardDescription>
            Rejoignez ShopTheBarber et commencez à réserver vos services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                <p className="text-destructive text-sm">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    placeholder="Prénom"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Nom</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="Nom"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

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
              <Label htmlFor="phone">Téléphone (optionnel)</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+212 6 XX XX XX XX"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Ville</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="city"
                  name="city"
                  type="text"
                  placeholder="Casablanca"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adresse (optionnel)</Label>
              <Input
                id="address"
                name="address"
                type="text"
                placeholder="123 Rue Example"
                value={formData.address}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Type de compte</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={formData.role === "client" ? "default" : "outline"}
                  onClick={() => handleRoleSelect("client")}
                  className="w-full"
                >
                  Client
                </Button>
                <Button
                  type="button"
                  variant={formData.role === "barber" ? "default" : "outline"}
                  onClick={() => handleRoleSelect("barber")}
                  className="w-full"
                >
                  Barbier
                </Button>
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
              <p className="text-xs text-muted-foreground">
                Au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <div className="relative">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 h-6 w-6"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirmez votre mot de passe"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="pr-10"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Créer mon compte
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Déjà un compte ?{" "}
              <Link
                to="/login"
                className="text-primary hover:underline font-medium"
              >
                Se connecter
              </Link>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-3">
                Votre compte sera protégé par l'authentification à deux facteurs
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Mail className="h-3 w-3" />
                <span>Chiffrement SSL/TLS</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

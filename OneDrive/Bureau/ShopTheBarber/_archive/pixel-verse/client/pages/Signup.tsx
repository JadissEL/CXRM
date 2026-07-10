import React, { useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Scissors, Eye, EyeOff, Mail, User, Phone, MapPin } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI, setAuthToken } from "../../shared/api";

export default function Signup() {
  const [formData, setFormData] = useState({
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      setIsLoading(false);
      return;
    }

    try {
      console.log('Attempting registration with:', { 
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        role: formData.role,
        phone: formData.phone,
        city: formData.city,
        address: formData.address
      });

      const response = await authAPI.register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        city: formData.city,
        address: formData.address,
        role: formData.role,
      });

      console.log('Registration response:', response);
      
      if (!response.token || !response.userId || !response.role) {
        throw new Error('Réponse invalide du serveur');
      }

      setAuthToken(response.token, response.userId);
      console.log('Auth token set, role:', response.role);
      
      // Redirection selon le rôle
      let redirectPath = "/client-dashboard"; // default
      switch (response.role) {
        case 'client':
          redirectPath = "/client-dashboard";
          break;
        case 'barber':
          redirectPath = "/barber-dashboard";
          break;
        case 'admin':
          redirectPath = "/admin-dashboard";
          break;
        default:
          redirectPath = "/client-dashboard";
      }
      
      console.log('Redirecting to:', redirectPath);
      navigate(redirectPath);
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error.message || "Erreur lors de l'inscription");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-800 border-gray-700">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500 text-black">
              <Scissors className="h-6 w-6" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            Créer un compte
          </CardTitle>
          <CardDescription className="text-gray-300">
            Rejoignez ShopTheBarber et trouvez votre barbier
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-white">
                  Prénom
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    placeholder="Prénom"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-white">
                  Nom
                </Label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="Nom"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-white">
                Téléphone
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+212 6 12 34 56 78"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="city" className="text-white">
                Ville
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="city"
                  name="city"
                  type="text"
                  placeholder="Casablanca"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-white">
                Adresse
              </Label>
              <Input
                id="address"
                name="address"
                type="text"
                placeholder="123 Rue Hassan II"
                value={formData.address}
                onChange={handleInputChange}
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
            </div>

            {/* Choix du type de compte */}
            <div className="space-y-2">
              <Label className="text-white">Type de compte</Label>
              <div className="flex gap-4 justify-center">
                <button
                  type="button"
                  onClick={() => handleRoleSelect('client')}
                  className={`flex-1 py-4 rounded-lg font-bold border-2 transition-all text-lg ${formData.role === 'client' ? 'bg-amber-500 border-amber-600 text-black shadow-lg' : 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'}`}
                >
                  Je suis un Client
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleSelect('barber')}
                  className={`flex-1 py-4 rounded-lg font-bold border-2 transition-all text-lg ${formData.role === 'barber' ? 'bg-amber-500 border-amber-600 text-black shadow-lg' : 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'}`}
                >
                  Je suis un Barbier
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleSelect('admin')}
                  className={`flex-1 py-4 rounded-lg font-bold border-2 transition-all text-lg ${formData.role === 'admin' ? 'bg-amber-500 border-amber-600 text-black shadow-lg' : 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'}`}
                >
                  Admin
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">
                Mot de passe
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="pl-10 pr-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-white">
                Confirmer le mot de passe
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="pl-10 pr-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-600 text-black font-medium"
              disabled={isLoading}
            >
              {isLoading ? "Création du compte..." : "Créer mon compte"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-300">
              Déjà un compte ?{" "}
              <Link
                to="/login"
                className="text-amber-500 hover:text-amber-400 font-medium"
              >
                Se connecter
              </Link>
            </p>
          </div>

          <div className="mt-6 text-center">
            <Link
              to="/"
              className="text-gray-400 hover:text-white text-sm"
            >
              ← Retour à l'accueil
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

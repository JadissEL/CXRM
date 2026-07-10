import React from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Scissors, Eye, EyeOff, Mail } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI, setAuthToken } from "../../shared/api";

export default function Login() {
  const [globalError, setGlobalError] = React.useState<string | null>(null);
  const [formData, setFormData] = React.useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const navigate = useNavigate();

  // Ajout d'un effet pour capturer les erreurs non catchées
  React.useEffect(() => {
    const handler = (event: ErrorEvent) => {
      setGlobalError(event.message || 'Erreur inconnue');
    };
    window.addEventListener('error', handler);
    return () => window.removeEventListener('error', handler);
  }, []);

  // Ajout d'un log pour vérifier le render
  console.log('Rendering Login page...');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      console.log('Attempting login with:', { email: formData.email, password: '***' });
      const response = await authAPI.login({ email: formData.email, password: formData.password });
      console.log('Login response:', response);
      
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
      console.error('Login error:', error);
      setError(error.message || "Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  };

  try {
    if (globalError) {
      return (
        <div style={{ color: 'red', background: '#222', padding: 32, fontSize: 18 }}>
          <b>Erreur dans la page de connexion :</b>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{globalError}</pre>
        </div>
      );
    }

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
              Connexion
            </CardTitle>
            <CardDescription className="text-gray-300">
              Accédez à votre compte ShopTheBarber
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">
                  Mot de passe
                </Label>
                                 <div className="relative">
                   <Eye className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                   <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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

              <Button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-600 text-black font-medium"
                disabled={isLoading}
              >
                {isLoading ? "Connexion..." : "Se connecter"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-300">
                Pas encore de compte ?{" "}
                <Link
                  to="/signup"
                  className="text-amber-500 hover:text-amber-400 font-medium"
                >
                  Créer un compte
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
  } catch (err: any) {
    setGlobalError(err?.message || String(err));
    return (
      <div style={{ color: 'red', background: '#222', padding: 32, fontSize: 18 }}>
        <b>Erreur dans la page de connexion (render) :</b>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{err?.message || String(err)}</pre>
      </div>
    );
  }
}

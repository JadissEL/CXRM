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
import { Scissors, Eye, EyeOff, Mail } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
// import { authAPI, setAuthToken } from "../../shared/api";
// Demo mode - using mock authentication

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
      setGlobalError(event.message || "Erreur inconnue");
    };
    window.addEventListener("error", handler);
    return () => window.removeEventListener("error", handler);
  }, []);

  // Ajout d'un log pour vérifier le render
  console.log("Rendering Login page...");

  // Mock setAuthToken function for demo mode
  const setAuthToken = (token: string, userId: number) => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem("token", token);
        localStorage.setItem("userId", userId.toString());
      }
    } catch (error) {
      console.error("Error setting auth token:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent double submission
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      console.log("Demo mode: Mock login with:", {
        email: formData.email,
        password: "***",
      });

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock successful response based on email
      let mockResponse;
      if (formData.email.includes("admin")) {
        mockResponse = {
          token: "demo-admin-token-123",
          userId: 1,
          role: "admin",
          user: { id: 1, email: formData.email },
        };
      } else if (formData.email.includes("barber")) {
        mockResponse = {
          token: "demo-barber-token-456",
          userId: 2,
          role: "barber",
          user: { id: 2, email: formData.email },
        };
      } else {
        mockResponse = {
          token: "demo-client-token-789",
          userId: 3,
          role: "client",
          user: { id: 3, email: formData.email },
        };
      }

      console.log("Demo login response:", mockResponse);

      const userId = mockResponse.userId || mockResponse.user?.id;
      setAuthToken(mockResponse.token, userId);
      console.log("Demo auth token set, role:", mockResponse.role);

      // Redirection selon le rôle
      let redirectPath = "/client-dashboard"; // default
      switch (mockResponse.role) {
        case "client":
          redirectPath = "/client-dashboard";
          break;
        case "barber":
          redirectPath = "/barber-dashboard";
          break;
        case "admin":
          redirectPath = "/admin-dashboard";
          break;
        default:
          redirectPath = "/client-dashboard";
      }

      console.log("Redirecting to:", redirectPath);
      navigate(redirectPath);
    } catch (error: any) {
      console.error("Login error:", error);
      setError(error.message || "Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  };

  try {
    if (globalError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-8">
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-8 max-w-lg w-full">
            <h2 className="text-destructive font-bold text-lg mb-4">
              Erreur dans la page de connexion :
            </h2>
            <pre className="text-destructive text-sm whitespace-pre-wrap">
              {globalError}
            </pre>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5"></div>

        <Card className="w-full max-w-lg bg-card/95 backdrop-blur-xl border border-border shadow-2xl relative z-10">
          <CardHeader className="text-center pb-8 pt-12">
            <div className="flex justify-center mb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg hover:scale-105 transition-transform duration-300">
                <Scissors className="h-8 w-8" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-foreground mb-3">
              Connexion
            </CardTitle>
            <CardDescription className="text-muted-foreground text-lg">
              Accédez à votre expérience premium ShopTheBarber
            </CardDescription>
          </CardHeader>
          <CardContent className="px-12 pb-12">
            {/* Demo Credentials Section */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6">
              <h4 className="text-primary font-semibold mb-2 text-sm">
                🎮 Mode Démo - Comptes de Test
              </h4>
              <div className="space-y-1 text-xs text-muted-foreground mb-3">
                <div>
                  👤 <strong>Client:</strong> client@demo.com (any password)
                </div>
                <div>
                  ✂️ <strong>Barbier:</strong> barber@demo.com (any password)
                </div>
                <div>
                  🛡️ <strong>Admin:</strong> admin@demo.com (any password)
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      email: "client@demo.com",
                      password: "demo123",
                    })
                  }
                  className="flex-1 px-2 py-1 bg-primary/10 text-primary rounded text-xs hover:bg-primary/20 transition-colors"
                >
                  Client
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      email: "barber@demo.com",
                      password: "demo123",
                    })
                  }
                  className="flex-1 px-2 py-1 bg-primary/10 text-primary rounded text-xs hover:bg-primary/20 transition-colors"
                >
                  Barbier
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      email: "admin@demo.com",
                      password: "demo123",
                    })
                  }
                  className="flex-1 px-2 py-1 bg-primary/10 text-primary rounded text-xs hover:bg-primary/20 transition-colors"
                >
                  Admin
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-destructive text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-foreground font-semibold text-sm"
                >
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="pl-12 pr-4 py-4 text-lg"
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label
                  htmlFor="password"
                  className="text-foreground font-semibold text-sm"
                >
                  Mot de passe
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="pr-12 pl-4 py-4 text-lg"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 hover:scale-110 transition-transform duration-200"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                    ) : (
                      <Eye className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 font-bold py-4 text-lg mt-8"
                disabled={isLoading}
              >
                {isLoading ? "Connexion..." : "Se connecter"}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-muted-foreground text-lg">
                Pas encore de compte ?{" "}
                <Link
                  to="/signup"
                  className="text-primary hover:text-primary/80 font-semibold underline transition-colors duration-300"
                >
                  Créer un compte
                </Link>
              </p>
            </div>

            <div className="mt-6 text-center">
              <Link
                to="/"
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
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
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-8 max-w-lg w-full">
          <h2 className="text-destructive font-bold text-lg mb-4">
            Erreur dans la page de connexion (render) :
          </h2>
          <pre className="text-destructive text-sm whitespace-pre-wrap">
            {err?.message || String(err)}
          </pre>
        </div>
      </div>
    );
  }
}

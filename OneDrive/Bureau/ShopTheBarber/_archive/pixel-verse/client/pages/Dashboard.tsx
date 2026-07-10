import React from "react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Scissors,
  ArrowRight,
  Calendar,
  Settings,
  Star,
  MessageSquare,
  Eye,
  Bell,
} from "lucide-react";
import { Link } from "react-router-dom";
import { UserNav } from "../components/UserNav";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Modern Sticky Header */}
      <header className="sticky top-0 z-50 w-full backdrop-blur bg-white/70 dark:bg-moroccan-charcoal/80 shadow-lg rounded-b-2xl border-b border-moroccan-gold/10 transition-all duration-300">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo Left */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-moroccan-gold to-moroccan-green text-white shadow-md">
              <Scissors className="h-5 w-5" />
            </div>
            <span className="font-display text-2xl font-bold tracking-tight text-moroccan-charcoal dark:text-moroccan-gold">ShopTheBarber</span>
          </Link>

          {/* Actions Right */}
          <div className="flex items-center space-x-2 md:space-x-4">
            <Button variant="ghost" size="icon" className="text-moroccan-gold hover:bg-moroccan-gold/10">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-moroccan-gold hover:bg-moroccan-gold/10">
              <Settings className="h-5 w-5" />
            </Button>
            {/* UserNav for user actions */}
            <div className="ml-2">
              <UserNav />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6">
        {/* Welcome Section */}
        <div className="text-center space-y-6 mb-12">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white">
            Bienvenue sur ShopTheBarber
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Choisissez votre espace pour accéder à toutes les fonctionnalités
            adaptées à votre profil.
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Client Dashboard */}
          <Card className="group bg-gray-800 border-gray-700 hover:border-amber-500/50 transition-all duration-300 cursor-pointer overflow-hidden">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-blue-800/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <CardHeader className="relative z-10 text-center pb-4">
                <div className="h-16 w-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-500/30 transition-colors">
                  {/* Users icon was removed, so this will be empty or a placeholder */}
                </div>
                <CardTitle className="text-2xl text-white">
                  Espace Client
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Réservez, gérez vos RDV et découvrez de nouveaux barbiers
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10 space-y-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-gray-700 p-3 rounded-lg text-center">
                      <Calendar className="h-5 w-5 mx-auto mb-1 text-blue-400" />
                      <p className="font-semibold text-white">Réservations</p>
                      <p className="text-xs text-gray-400">
                        Gérez vos RDV facilement
                      </p>
                    </div>
                    <div className="bg-gray-700 p-3 rounded-lg text-center">
                      <Star className="h-5 w-5 mx-auto mb-1 text-amber-400" />
                      <p className="font-semibold text-white">Favoris</p>
                      <p className="text-xs text-gray-400">
                        Vos barbiers préférés
                      </p>
                    </div>
                  </div>
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h4 className="font-semibold text-white mb-2">
                      Fonctionnalités incluses:
                    </h4>
                    <ul className="space-y-1 text-sm text-gray-300">
                      <li>• Recherche et réservation en ligne</li>
                      <li>• Historique des visites</li>
                      <li>• Gestion des barbiers favoris</li>
                      <li>• Notifications de rappel</li>
                      <li>• Système d'avis et notes</li>
                    </ul>
                  </div>
                </div>
                <Link to="/client-dashboard" className="block">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white group-hover:bg-blue-500">
                    Accéder à mon espace
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardContent>
            </div>
          </Card>

          {/* Barber Dashboard */}
          <Card className="group bg-gray-800 border-gray-700 hover:border-amber-500/50 transition-all duration-300 cursor-pointer overflow-hidden">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-600/20 to-amber-800/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <CardHeader className="relative z-10 text-center pb-4">
                <div className="h-16 w-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-amber-500/30 transition-colors">
                  <Scissors className="h-8 w-8 text-amber-500" />
                </div>
                <CardTitle className="text-2xl text-white">
                  CRM Barbier
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Gérez votre salon, clients et rendez-vous professionnellement
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10 space-y-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-gray-700 p-3 rounded-lg text-center">
                      {/* BarChart3 icon was removed, so this will be empty or a placeholder */}
                    </div>
                    <div className="bg-gray-700 p-3 rounded-lg text-center">
                      <MessageSquare className="h-5 w-5 mx-auto mb-1 text-purple-400" />
                      <p className="font-semibold text-white">Avis</p>
                      <p className="text-xs text-gray-400">
                        Gestion de réputation
                      </p>
                    </div>
                  </div>
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h4 className="font-semibold text-white mb-2">
                      CRM Complet inclus:
                    </h4>
                    <ul className="space-y-1 text-sm text-gray-300">
                      <li>• Planning et gestion des RDV</li>
                      <li>• Base de données clients</li>
                      <li>• Statistiques et revenus</li>
                      <li>• Galerie photos de travaux</li>
                      <li>• Gestion des avis clients</li>
                    </ul>
                  </div>
                </div>
                <Link to="/barber-dashboard" className="block">
                  <Button className="w-full bg-amber-600 hover:bg-amber-700 text-black group-hover:bg-amber-500 font-medium">
                    <Scissors className="mr-2 h-4 w-4" />
                    Accéder à mon CRM
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardContent>
            </div>
          </Card>

          {/* Admin Dashboard */}
          <Card className="group bg-gray-800 border-gray-700 hover:border-amber-500/50 transition-all duration-300 cursor-pointer overflow-hidden">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 to-red-800/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <CardHeader className="relative z-10 text-center pb-4">
                <div className="h-16 w-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-red-500/30 transition-colors">
                  {/* Shield icon was removed, so this will be empty or a placeholder */}
                </div>
                <CardTitle className="text-2xl text-white">
                  Administration
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Contrôlez et modérez la plateforme ShopTheBarber
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10 space-y-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-gray-700 p-3 rounded-lg text-center">
                      {/* TrendingUp icon was removed, so this will be empty or a placeholder */}
                    </div>
                    <div className="bg-gray-700 p-3 rounded-lg text-center">
                      <Eye className="h-5 w-5 mx-auto mb-1 text-blue-400" />
                      <p className="font-semibold text-white">Modération</p>
                      <p className="text-xs text-gray-400">Contrôle qualité</p>
                    </div>
                  </div>
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h4 className="font-semibold text-white mb-2">
                      Outils d'administration:
                    </h4>
                    <ul className="space-y-1 text-sm text-gray-300">
                      <li>• Approbation des barbiers</li>
                      <li>• Modération du contenu</li>
                      <li>• Gestion des utilisateurs</li>
                      <li>• Analyses de la plateforme</li>
                      <li>• Traitement des signalements</li>
                    </ul>
                  </div>
                  <div className="flex items-center justify-center space-x-2 p-3 bg-red-900/20 rounded-lg border border-red-800/30">
                    <Badge className="bg-red-600 text-white">15 actions en attente</Badge>
                  </div>
                </div>
                <Link to="/admin-dashboard" className="block">
                  <Button className="w-full bg-red-600 hover:bg-red-700 text-white group-hover:bg-red-500">
                    {/* Shield icon was removed, so this will be empty or a placeholder */}
                    Panel d'administration
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardContent>
            </div>
          </Card>
        </div>

        {/* Info Section */}
        <div className="mt-16 text-center">
          <Card className="bg-gray-800/50 border-gray-700 max-w-4xl mx-auto">
            <CardContent className="p-8">
              <h3 className="text-xl font-semibold text-white mb-4">
                Première Connexion ?
              </h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Chaque espace est conçu spécifiquement pour votre rôle sur la
                plateforme. Les clients peuvent réserver et gérer leurs
                rendez-vous, les barbiers disposent d'un CRM complet pour leur
                activité, et les administrateurs contrôlent la qualité de la
                plateforme.
              </p>
              <div className="grid md:grid-cols-3 gap-6 text-sm">
                <div className="text-center">
                  {/* Users icon was removed, so this will be empty or a placeholder */}
                  <p className="font-semibold text-white">Pour les Clients</p>
                  <p className="text-gray-400">
                    Interface simple et intuitive pour réserver facilement
                  </p>
                </div>
                <div className="text-center">
                  <Scissors className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                  <p className="font-semibold text-white">Pour les Barbiers</p>
                  <p className="text-gray-400">
                    Outils professionnels de gestion d'entreprise
                  </p>
                </div>
                <div className="text-center">
                  {/* Shield icon was removed, so this will be empty or a placeholder */}
                  <p className="font-semibold text-white">
                    Pour les Administrateurs
                  </p>
                  <p className="text-gray-400">
                    Contrôle total et modération de la plateforme
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

# LeBarbier - Barber Shop Management System

A modern barber shop management system built with Next.js, Supabase, and Clerk authentication.

## 🚀 Features

### Authentication & User Management
- **Multi-provider Authentication**: Email/password, Google, Facebook, Apple
- **Two-Factor Authentication (2FA/MFA)**: Built-in support via Clerk
- **Role-based Access Control**: Client and Barber roles
- **Email Verification**: Required for account activation
- **Password Recovery**: Secure password reset flow
- **User Status Management**: Ban/unban users, verification status
- **Real-time Sync**: Clerk ↔ Supabase data synchronization

### Security Features
- **Row Level Security (RLS)**: Supabase database protection
- **JWT-based API Security**: Clerk JWT validation
- **Password Strength Validation**: Real-time password strength meter
- **Session Management**: Automatic session timeout handling
- **Webhook Security**: Verified Clerk webhook endpoints

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Authentication**: Clerk
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form + Zod validation
- **Testing**: Jest + React Testing Library
- **UI Components**: Radix UI primitives

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account and project
- Clerk account and application

## ⚡ Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd lebarbier
npm install
```

### 2. Environment Setup

Copy the example environment file:

```bash
cp .env.example .env.local
```

Fill in your environment variables (see `.env.example` for all required variables):

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 3. Database Setup

Run the Supabase migrations:

```bash
npx supabase db reset
```

### 4. Clerk Configuration

1. **Create Clerk Application** and enable providers
2. **Configure OAuth Providers** (Google, Facebook, Apple)
3. **Enable 2FA/MFA** in Clerk dashboard
4. **Set up Webhooks**: `https://yourdomain.com/api/webhooks/clerk`

### 5. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 🏗 Project Structure

```
lebarbier/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication routes
│   │   ├── sign-in/              # Sign-in page
│   │   ├── sign-up/              # Sign-up page
│   │   └── forgot-password/      # Password recovery
│   ├── api/webhooks/             # Webhook handlers
│   ├── dashboard/                # Protected dashboard
│   └── layout.tsx                # Root layout with providers
├── components/auth/              # Authentication components
│   ├── SignUpForm.tsx            # Custom sign-up form
│   ├── SocialSignIn.tsx          # Social authentication
│   └── PasswordRecovery.tsx      # Password reset
├── lib/                          # Utility libraries
│   ├── supabase.ts               # Supabase client & helpers
│   └── database.types.ts         # TypeScript types
├── supabase/migrations/          # Database migrations
├── __tests__/                    # Comprehensive test suite
└── middleware.ts                 # Authentication middleware
```

## 🔐 Authentication Features

### Complete Sign-Up Flow
1. **Form Validation**: Real-time validation with Zod
2. **Password Strength**: Visual strength meter
3. **Role Selection**: Client or Barber role
4. **Email Verification**: Required before access
5. **Profile Creation**: Automatic Supabase sync via webhooks

### Multi-Provider Sign-In
- Email/password with validation
- Google OAuth
- Facebook OAuth  
- Apple Sign In
- Optional 2FA/MFA challenge

### Security & Status Management
- User ban/unban functionality
- Email verification enforcement
- Session timeout handling
- JWT-secured API endpoints
- Row Level Security policies

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage
```

**Test Coverage**: 80%+ across all metrics
- Component tests for all auth components
- API tests for webhook handlers
- Integration tests for complete flows
- Unit tests for utility functions

## 🚀 Deployment

### Production Checklist
- [ ] Environment variables configured
- [ ] Database migrations applied  
- [ ] Clerk webhooks updated
- [ ] OAuth redirect URLs updated
- [ ] SSL certificate active

## 📚 API Reference

### Webhook: POST /api/webhooks/clerk
Handles user lifecycle events:
- `user.created` → Creates Supabase profile
- `user.updated` → Syncs user data
- `user.deleted` → Soft delete
- `session.created` → MFA status sync

### Supabase Helpers
```typescript
// User management
await createUserProfile(userData);
await checkUserStatus(userId);
await updateUserMFAStatus(userId, enabled);
```

## 🔍 Troubleshooting

**Common Issues**:
- Webhook verification: Check `CLERK_WEBHOOK_SECRET`
- Supabase connection: Verify service role key
- OAuth issues: Check redirect URLs
- RLS errors: Verify JWT claims

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit pull request

## 🚀 Fonctionnalités

### Pour les Clients
- **Inscription et Connexion** : Système d'authentification sécurisé
- **Recherche de Barbiers** : Filtrage par services, localisation et type de prestation
- **Réservation en Ligne** : Réservation de créneaux avec sélection de services
- **Gestion des RDV** : Consultation, modification et annulation des rendez-vous
- **Système de Favoris** : Ajout et gestion des barbiers favoris
- **Avis et Notes** : Notation et commentaires sur les services
- **Notifications** : Rappels et alertes personnalisées
- **Profil Utilisateur** : Gestion des informations personnelles

### Pour les Barbiers
- **Profil Professionnel** : Présentation des services et tarifs
- **Gestion des Disponibilités** : Planning et créneaux disponibles
- **Offres Spéciales** : Promotions et réductions personnalisées
- **Historique des RDV** : Suivi des réservations et clients

## 🛠️ Technologies Utilisées

### Frontend
- **React 18** avec TypeScript
- **Vite** pour le build et le développement
- **Tailwind CSS** pour le styling
- **Lucide React** pour les icônes
- **React Router** pour la navigation

### Backend
- **Node.js** avec Express
- **SQLite** pour la base de données
- **JWT** pour l'authentification
- **bcryptjs** pour le hachage des mots de passe

### Base de Données
- **SQLite** avec schéma relationnel complet
- **Tables** : Users, Barbers, Services, Appointments, Reviews, Favorites, etc.

## 📦 Installation

1. **Cloner le projet**
```bash
git clone <repository-url>
cd pixel-verse
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Lancer l'application**
```bash
# Lancer le frontend et le backend en même temps
npm run dev:full

# Ou lancer séparément :
npm run dev          # Frontend (port 8080)
npm run dev:server   # Backend (port 3001)
```

## 🗄️ Base de Données

La base de données SQLite est automatiquement créée et initialisée avec des données de test :

### Données de Test Incluses
- **Utilisateurs** : 5 comptes clients de test
- **Barbiers** : 4 barbiers avec profils complets
- **Services** : 10 services différents (coupe, barbe, soins, etc.)
- **Réservations** : Exemples de RDV passés et à venir
- **Avis** : Commentaires et notes d'exemple

### Structure de la Base
```
users/           # Utilisateurs clients
barbers/         # Profils des barbiers
services/        # Services disponibles
barber_services/ # Services proposés par chaque barbier
appointments/    # Réservations
reviews/         # Avis clients
favorites/       # Barbiers favoris
notifications/   # Notifications système
```

## 🔧 Configuration

### Variables d'Environnement
```env
PORT=3001                    # Port du serveur backend
JWT_SECRET=your-secret-key   # Clé secrète JWT
```

### API Endpoints

#### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion

#### Services
- `GET /api/services` - Liste des services

#### Barbiers
- `GET /api/barbers` - Liste des barbiers (avec filtres)
- `GET /api/barbers/:id` - Détails d'un barbier

#### Réservations
- `POST /api/appointments` - Créer une réservation
- `GET /api/appointments` - Mes réservations
- `PUT /api/appointments/:id/cancel` - Annuler une réservation

#### Favoris
- `POST /api/favorites` - Ajouter aux favoris
- `DELETE /api/favorites/:id` - Retirer des favoris
- `GET /api/favorites` - Mes favoris

#### Profil
- `GET /api/profile` - Mon profil
- `PUT /api/profile` - Modifier mon profil

## 🎨 Interface Utilisateur

### Pages Principales
1. **Page d'Accueil** (`/`) - Présentation et recherche
2. **Connexion** (`/login`) - Authentification
3. **Inscription** (`/signup`) - Création de compte
4. **Dashboard Client** (`/dashboard`) - Espace personnel
5. **Blog** (`/blog`) - Articles et conseils

### Design
- **Thème Sombre** : Interface moderne avec fond noir/gris
- **Couleurs** : Orange ambré (#f59e0b) pour les accents
- **Responsive** : Adaptation mobile et desktop
- **Animations** : Transitions fluides et micro-interactions

## 🔐 Sécurité

- **Authentification JWT** : Tokens sécurisés
- **Hachage des Mots de Passe** : bcrypt avec salt
- **Validation des Données** : Vérification côté serveur
- **CORS** : Configuration sécurisée pour les requêtes

## 📱 Utilisation

### Première Utilisation
1. Accéder à `http://localhost:8080`
2. Créer un compte ou se connecter
3. Explorer les barbiers disponibles
4. Effectuer une première réservation

### Fonctionnalités Avancées
- **Filtrage** : Par services, localisation, type de prestation
- **Recherche** : Nom de barbier, salon, spécialités
- **Notifications** : Rappels automatiques des RDV
- **Historique** : Suivi des réservations passées

## 🚀 Déploiement

### Production
```bash
# Build de l'application
npm run build

# Démarrage en production
npm start
```

### Variables d'Environnement de Production
```env
NODE_ENV=production
PORT=3001
JWT_SECRET=your-production-secret
DATABASE_URL=path/to/production.db
```

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 📞 Support

Pour toute question ou problème :
- Email : contact@shopthebarber.ma
- Téléphone : +212 6 12 34 56 78

---

**ShopTheBarber** - La plateforme qui connecte les barbiers et clients à travers le Maroc 🇲🇦
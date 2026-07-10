import { useAdminUserManagement } from './useAdminUserManagement';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Search, UserCheck, UserX, Shield, Ban, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function AdminUserManagement() {
    const {
        users,
        stats,
        roleColors,
        searchQuery,
        setSearchQuery,
        isLoading,
        error
    } = useAdminUserManagement();

    if (isLoading) {
        return <UserManagementSkeleton />;
    }

    if (error) {
        return (
            <div className="min-h-screen py-12 bg-background-light dark:bg-background-dark flex items-center justify-center">
                <Card className="max-w-md w-full border-2 border-red-200">
                    <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="font-bold text-lg text-red-900 mb-2">Error Loading Users</h3>
                                <p className="text-sm text-red-700">{error.message}</p>
                                <Button
                                    variant="outline"
                                    className="mt-4"
                                    onClick={() => window.location.reload()}
                                >
                                    Retry
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-12 bg-background-light dark:bg-background-dark font-sans">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <h1 className="text-4xl font-display font-bold text-charcoal dark:text-white mb-2">Gestion des Utilisateurs</h1>
                    <p className="text-lg text-slate dark:text-matte-silver">Gérez tous les utilisateurs de la plateforme</p>
                </motion.div>

                <div className="grid md:grid-cols-4 gap-6 mb-8">
                    {[
                        { label: "Total Utilisateurs", value: stats.total, icon: Users, color: "text-blue-600" },
                        { label: "Clients", value: stats.clients, icon: UserCheck, color: "text-emerald-600" },
                        { label: "Barbiers", value: stats.barbers, icon: Shield, color: "text-purple-600" },
                        { label: "Suspendus", value: stats.suspended, icon: UserX, color: "text-red-600" }
                    ].map((stat, idx) => (
                        <Card key={idx} className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                                    <span className="text-sm text-slate dark:text-matte-silver">{stat.label}</span>
                                </div>
                                <p className="text-3xl font-bold text-charcoal dark:text-white">{stat.value}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark mb-6">
                    <CardContent className="p-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate" />
                            <Input
                                placeholder="Rechercher un utilisateur..."
                                className="pl-10 rounded-xl"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    {users.length === 0 ? (
                        <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                            <CardContent className="p-12 text-center">
                                <Users className="w-12 h-12 text-slate mx-auto mb-4" />
                                <p className="text-lg text-slate dark:text-matte-silver">
                                    {searchQuery ? 'Aucun utilisateur trouvé' : 'Aucun utilisateur'}
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        users.map((user, idx) => (
                            <motion.div key={user.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                                <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <Avatar className="w-12 h-12">
                                                    <AvatarFallback className="bg-primary text-white">
                                                        {user.full_name?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <h3 className="font-bold text-charcoal dark:text-white">
                                                        {user.full_name || user.email}
                                                    </h3>
                                                    <p className="text-sm text-slate dark:text-matte-silver">{user.email}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6">
                                                <div>
                                                    <Badge variant="default" className={`${roleColors[user.role]?.bg || roleColors.client.bg} ${roleColors[user.role]?.text || roleColors.client.text} border-0`}>
                                                        {roleColors[user.role]?.label || user.role}
                                                    </Badge>
                                                </div>

                                                <div className="text-center">
                                                    <p className="text-sm text-slate dark:text-matte-silver">Membre depuis</p>
                                                    <p className="text-sm font-medium text-charcoal dark:text-white">
                                                        {user.created_date ? new Date(user.created_date).toLocaleDateString('fr-FR') : 'N/A'}
                                                    </p>
                                                </div>

                                                <div className="flex gap-2">
                                                    {user.status === 'active' || !user.is_suspended ? (
                                                        <Button variant="outline" size="sm" className="rounded-lg border-red-200 text-red-600 hover:bg-red-50">
                                                            <Ban className="w-4 h-4 mr-1" />
                                                            Suspendre
                                                        </Button>
                                                    ) : (
                                                        <Button variant="outline" size="sm" className="rounded-lg border-emerald-200 text-emerald-600 hover:bg-emerald-50">
                                                            <UserCheck className="w-4 h-4 mr-1" />
                                                            Activer
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

// Skeleton component for loading state
function UserManagementSkeleton() {
    return (
        <div className="min-h-screen py-12 bg-background-light dark:bg-background-dark">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header Skeleton */}
                <div className="mb-8">
                    <div className="h-10 w-96 bg-gray-200 rounded animate-pulse mb-2" />
                    <div className="h-6 w-64 bg-gray-200 rounded animate-pulse" />
                </div>

                {/* Stats Grid Skeleton */}
                <div className="grid md:grid-cols-4 gap-6 mb-8">
                    {[1, 2, 3, 4].map(i => (
                        <Card key={i} className="rounded-2xl">
                            <CardContent className="p-6">
                                <div className="animate-pulse space-y-3">
                                    <div className="h-5 w-32 bg-gray-200 rounded" />
                                    <div className="h-8 w-16 bg-gray-200 rounded" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Search Skeleton */}
                <Card className="rounded-2xl mb-6">
                    <CardContent className="p-6">
                        <div className="h-10 bg-gray-200 rounded-xl animate-pulse" />
                    </CardContent>
                </Card>

                {/* User List Skeleton */}
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <Card key={i} className="rounded-2xl">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4 animate-pulse">
                                    <div className="w-12 h-12 bg-gray-200 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-5 w-48 bg-gray-200 rounded" />
                                        <div className="h-4 w-64 bg-gray-200 rounded" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}

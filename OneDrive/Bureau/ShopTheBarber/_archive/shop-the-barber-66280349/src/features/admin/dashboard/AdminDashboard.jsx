import { useAdminDashboard } from './useAdminDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
    Shield,
    Search,
    Download,
    BarChart3,
    Users,
    Scissors,
    ShoppingBag,
    FileText,
    CheckCircle,
    AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function AdminDashboard() {
    const {
        stats,
        users,
        bookings,
        orders,
        articles,
        searchQuery,
        setSearchQuery,
        selectedTab,
        setSelectedTab,
        isLoading,
        error
    } = useAdminDashboard();

    if (isLoading) {
        return <DashboardSkeleton />;
    }

    if (error) {
        return (
            <div className="min-h-screen py-12 bg-[#F7F8FA] flex items-center justify-center">
                <Card className="max-w-md w-full border-2 border-red-200">
                    <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="font-bold text-lg text-red-900 mb-2">Error Loading Dashboard</h3>
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
        <div className="min-h-screen py-12 bg-[#F7F8FA]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-4xl font-bold text-[#0B2545] mb-2">
                                Dashboard Administrateur
                            </h1>
                            <p className="text-[#4B5563]">
                                Vue d'ensemble et gestion de la plateforme
                            </p>
                        </div>
                        <Badge variant="default" className="bg-[#D6454A] text-white border-0 px-4 py-2 rounded-[10px]">
                            <Shield className="w-4 h-4 mr-2" />
                            Admin
                        </Badge>
                    </div>
                </motion.div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {stats.map((stat, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card className="rounded-[12px] border-2 border-slate-200 hover:border-[#D08B3D] hover:shadow-xl transition-all">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={`w-12 h-12 ${stat.color} rounded-[10px] flex items-center justify-center shadow-lg`}>
                                            <stat.icon className="w-6 h-6 text-white" />
                                        </div>
                                        <Badge variant="secondary" className="bg-[#1E7A4B]/20 text-[#1E7A4B] border-0 rounded-[8px]">
                                            {stat.change}
                                        </Badge>
                                    </div>
                                    <h3 className="text-sm text-[#4B5563] mb-2">{stat.title}</h3>
                                    <p className="text-3xl font-bold text-[#0B2545]">{stat.value}</p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {/* Main Content Tabs */}
                <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                    <TabsList className="bg-white rounded-[10px] border border-slate-200 p-1 mb-8">
                        <TabsTrigger value="overview" className="rounded-[8px] min-h-[44px] data-[state=active]:bg-[#0B2545] data-[state=active]:text-white">
                            <BarChart3 className="w-4 h-4 mr-2" />Vue d'ensemble
                        </TabsTrigger>
                        <TabsTrigger value="users" className="rounded-[8px] min-h-[44px] data-[state=active]:bg-[#0B2545] data-[state=active]:text-white">
                            <Users className="w-4 h-4 mr-2" />Utilisateurs
                        </TabsTrigger>
                        <TabsTrigger value="bookings" className="rounded-[8px] min-h-[44px] data-[state=active]:bg-[#0B2545] data-[state=active]:text-white">
                            <Scissors className="w-4 h-4 mr-2" />Réservations
                        </TabsTrigger>
                        <TabsTrigger value="orders" className="rounded-[8px] min-h-[44px] data-[state=active]:bg-[#0B2545] data-[state=active]:text-white">
                            <ShoppingBag className="w-4 h-4 mr-2" />Commandes
                        </TabsTrigger>
                        <TabsTrigger value="content" className="rounded-[8px] min-h-[44px] data-[state=active]:bg-[#0B2545] data-[state=active]:text-white">
                            <FileText className="w-4 h-4 mr-2" />Contenu
                        </TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview">
                        <div className="grid lg:grid-cols-2 gap-6">
                            {/* Recent Bookings */}
                            <Card className="border-2 border-slate-200">
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        <span className="text-slate-900">Réservations Récentes</span>
                                        <Button variant="outline" size="sm" className="border-slate-300">
                                            Voir tout
                                        </Button>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {bookings.slice(0, 5).map((booking) => (
                                            <div key={booking.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                                                <div>
                                                    <p className="font-semibold text-slate-900">Réservation #{booking.id.slice(0, 8)}</p>
                                                    <p className="text-sm text-slate-600">
                                                        {format(new Date(booking.booking_date), 'dd MMM yyyy', { locale: fr })}
                                                    </p>
                                                </div>
                                                <Badge variant="default" className={
                                                    booking.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                                                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-green-100 text-green-700'
                                                }>
                                                    {booking.status}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Recent Orders */}
                            <Card className="border-2 border-slate-200">
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        <span className="text-slate-900">Commandes Récentes</span>
                                        <Button variant="outline" size="sm" className="border-slate-300">
                                            Voir tout
                                        </Button>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {orders.slice(0, 5).map((order) => (
                                            <div key={order.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                                                <div>
                                                    <p className="font-semibold text-slate-900">Commande #{order.id.slice(0, 8)}</p>
                                                    <p className="text-sm text-slate-600">
                                                        {order.total_amount}€
                                                    </p>
                                                </div>
                                                <Badge variant="default" className={
                                                    order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                                        order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-yellow-100 text-yellow-700'
                                                }>
                                                    {order.status}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Users Tab */}
                    <TabsContent value="users">
                        <Card className="border-2 border-slate-200">
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between text-slate-900">
                                    <span>Gestion des Utilisateurs ({users.length})</span>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" className="border-slate-300">
                                            <Download className="w-4 h-4 mr-2" />
                                            Exporter
                                        </Button>
                                    </div>
                                </CardTitle>
                                <div className="relative mt-4">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                    <Input
                                        placeholder="Rechercher un utilisateur..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 border-slate-300"
                                    />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {users.slice(0, 10).map((user) => (
                                        <div key={user.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                                                    <span className="text-white font-bold text-sm">
                                                        {user.full_name?.[0] || user.email[0].toUpperCase()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900">{user.full_name || user.email}</p>
                                                    <p className="text-sm text-slate-600">{user.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Badge variant="default" className={
                                                    user.role === 'admin' ? 'bg-red-100 text-red-700' :
                                                        user.role === 'barber' ? 'bg-blue-100 text-blue-700' :
                                                            user.role === 'vendor' ? 'bg-purple-100 text-purple-700' :
                                                                'bg-slate-100 text-slate-700'
                                                }>
                                                    {user.role}
                                                </Badge>
                                                {user.verified && (
                                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Bookings Tab */}
                    <TabsContent value="bookings">
                        <Card className="border-2 border-slate-200">
                            <CardHeader>
                                <CardTitle className="text-slate-900">Toutes les Réservations ({bookings.length})</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {bookings.map((booking) => (
                                        <div key={booking.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                                            <div>
                                                <p className="font-semibold text-slate-900">Réservation #{booking.id.slice(0, 8)}</p>
                                                <p className="text-sm text-slate-600">
                                                    {format(new Date(booking.booking_date), 'dd MMMM yyyy', { locale: fr })} à {booking.booking_time}
                                                </p>
                                                <p className="text-sm text-slate-500 mt-1">
                                                    Montant: {booking.total_price}€
                                                </p>
                                            </div>
                                            <Badge variant="default" className={
                                                booking.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                                                    booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                        booking.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                            'bg-red-100 text-red-700'
                                            }>
                                                {booking.status}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Orders Tab */}
                    <TabsContent value="orders">
                        <Card className="border-2 border-slate-200">
                            <CardHeader>
                                <CardTitle className="text-slate-900">Toutes les Commandes ({orders.length})</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {orders.map((order) => (
                                        <div key={order.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                                            <div>
                                                <p className="font-semibold text-slate-900">Commande #{order.id.slice(0, 8)}</p>
                                                <p className="text-sm text-slate-600">
                                                    {format(new Date(order.created_date), 'dd MMMM yyyy', { locale: fr })}
                                                </p>
                                                <p className="text-sm font-semibold text-slate-900 mt-1">
                                                    Total: {order.total_amount}€
                                                </p>
                                            </div>
                                            <Badge variant="default" className={
                                                order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                                    order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                                                        order.status === 'processing' ? 'bg-purple-100 text-purple-700' :
                                                            'bg-yellow-100 text-yellow-700'
                                            }>
                                                {order.status}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Content Tab */}
                    <TabsContent value="content">
                        <Card className="border-2 border-slate-200">
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between text-slate-900">
                                    <span>Articles de Blog ({articles.length})</span>
                                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                                        Nouvel Article
                                    </Button>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {articles.map((article) => (
                                        <div key={article.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                                            <div className="flex-1">
                                                <p className="font-semibold text-slate-900">{article.title}</p>
                                                <p className="text-sm text-slate-600 mt-1">{article.excerpt}</p>
                                                <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                                                    <span>{format(new Date(article.created_date), 'dd MMM yyyy', { locale: fr })}</span>
                                                    <span>{article.views || 0} vues</span>
                                                    <span>{article.likes || 0} likes</span>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className={article.published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                                                {article.published ? 'Publié' : 'Brouillon'}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

// Skeleton component for loading state
function DashboardSkeleton() {
    return (
        <div className="min-h-screen py-12 bg-[#F7F8FA]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header Skeleton */}
                <div className="mb-8">
                    <div className="h-10 w-64 bg-gray-200 rounded animate-pulse mb-2" />
                    <div className="h-4 w-96 bg-gray-200 rounded animate-pulse" />
                </div>

                {/* Stats Grid Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[1, 2, 3, 4].map(i => (
                        <Card key={i} className="rounded-[12px] border-2 border-slate-200">
                            <CardContent className="p-6">
                                <div className="animate-pulse space-y-4">
                                    <div className="h-12 w-12 bg-gray-200 rounded-[10px]" />
                                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                                    <div className="h-8 bg-gray-200 rounded w-1/2" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Tabs Skeleton */}
                <div className="h-12 bg-white rounded-[10px] border border-slate-200 mb-8 animate-pulse" />

                {/* Content Skeleton */}
                <Card className="border-2 border-slate-200">
                    <CardContent className="p-6">
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-20 bg-gray-200 rounded animate-pulse" />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

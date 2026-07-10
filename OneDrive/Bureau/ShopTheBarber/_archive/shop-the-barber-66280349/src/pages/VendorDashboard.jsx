import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Package,
  DollarSign,
  ShoppingCart,
  Plus,
  Edit,
  Eye,
  Star
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function VendorDashboard() {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: products = [] } = useQuery({
    queryKey: ['my-products', user?.id],
    queryFn: () => base44.entities.Product.filter({ vendor_id: user.id }),
    enabled: !!user
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['vendor-orders', user?.id],
    queryFn: async () => {
      const allOrders = await base44.entities.Order.list('-created_date');
      return allOrders.filter(order => 
        order.items?.some(item => products.some(p => p.id === item.product_id))
      );
    },
    enabled: !!user && products.length > 0
  });

  const activeProducts = products.filter(p => p.is_active).length;
  const totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
  const totalSales = orders.length;

  const stats = [
    { title: "Produits Actifs", value: activeProducts, icon: Package, color: "bg-[#0B2545]", subtitle: `sur ${products.length} total` },
    { title: "Revenus Totaux", value: `${totalRevenue.toFixed(2)}€`, icon: DollarSign, color: "bg-[#1E7A4B]", subtitle: "ce mois" },
    { title: "Ventes", value: totalSales, icon: ShoppingCart, color: "bg-[#D08B3D]", subtitle: "commandes" },
    { title: "Note Moyenne", value: "4.8", icon: Star, color: "bg-[#D08B3D]", subtitle: "sur vos produits" }
  ];

  const statusColors = {
    delivered: "bg-[#1E7A4B]/20 text-[#1E7A4B]",
    shipped: "bg-[#0B2545]/20 text-[#0B2545]",
    pending: "bg-[#D08B3D]/20 text-[#D08B3D]",
    processing: "bg-[#0B2545]/20 text-[#0B2545]"
  };

  return (
    <div className="min-h-screen py-12 bg-[#F7F8FA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-[#0B2545] mb-2">Dashboard Vendeur</h1>
              <p className="text-[#4B5563]">Gérez vos produits et vos ventes</p>
            </div>
            <Button className="bg-[#D08B3D] hover:bg-[#D08B3D]/90 text-white rounded-[10px] min-h-[44px]">
              <Plus className="w-4 h-4 mr-2" />
              Nouveau Produit
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
              <Card className="rounded-[12px] border-2 border-slate-200 hover:border-[#D08B3D] hover:shadow-xl transition-all">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 ${stat.color} rounded-[10px] flex items-center justify-center mb-4 shadow-lg`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-sm text-[#4B5563] mb-1">{stat.title}</h3>
                  <p className="text-3xl font-bold text-[#0B2545] mb-1">{stat.value}</p>
                  <p className="text-xs text-[#4B5563]">{stat.subtitle}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="bg-white rounded-[10px] border border-slate-200 p-1">
            <TabsTrigger value="products" className="rounded-[8px] min-h-[44px] data-[state=active]:bg-[#0B2545] data-[state=active]:text-white">
              <Package className="w-4 h-4 mr-2" />Mes Produits
            </TabsTrigger>
            <TabsTrigger value="orders" className="rounded-[8px] min-h-[44px] data-[state=active]:bg-[#0B2545] data-[state=active]:text-white">
              <ShoppingCart className="w-4 h-4 mr-2" />Commandes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <Card className="rounded-[12px] border-2 border-slate-200">
              <CardHeader>
                <CardTitle className="text-[#0B2545]">Catalogue de Produits ({products.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <div key={product.id} className="border-2 border-slate-200 rounded-[12px] overflow-hidden hover:border-[#D08B3D] transition-all">
                      <div className="relative aspect-square bg-slate-100">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-16 h-16 text-slate-300" />
                          </div>
                        )}
                        <Badge className={`absolute top-3 right-3 ${product.is_active ? 'bg-[#1E7A4B]/20 text-[#1E7A4B]' : 'bg-[#D6454A]/20 text-[#D6454A]'}`}>
                          {product.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                      </div>
                      <div className="p-4 bg-white">
                        <h3 className="font-bold text-[#0B2545] mb-2">{product.name}</h3>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-2xl font-bold text-[#D08B3D]">{product.price}€</span>
                          <span className="text-sm text-[#4B5563]">Stock: {product.stock}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1 rounded-[8px] border-slate-200 min-h-[44px]">
                            <Edit className="w-3 h-3 mr-1" />Modifier
                          </Button>
                          <Link to={createPageUrl(`ProductDetail?id=${product.id}`)} className="flex-1">
                            <Button variant="outline" size="sm" className="w-full rounded-[8px] border-slate-200 min-h-[44px]">
                              <Eye className="w-3 h-3 mr-1" />Voir
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card className="rounded-[12px] border-2 border-slate-200">
              <CardHeader>
                <CardTitle className="text-[#0B2545]">Commandes Reçues ({orders.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {orders.length === 0 ? (
                    <p className="text-[#4B5563] text-center py-8">Aucune commande pour le moment</p>
                  ) : (
                    orders.map((order) => (
                      <div key={order.id} className="p-6 bg-[#F7F8FA] rounded-[12px] border-2 border-slate-200">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="font-bold text-[#0B2545]">Commande #{order.id.slice(0, 8)}</p>
                            <p className="text-sm text-[#4B5563]">
                              {format(new Date(order.created_date), 'dd MMMM yyyy', { locale: fr })}
                            </p>
                          </div>
                          <Badge className={statusColors[order.status] || statusColors.pending}>
                            {order.status}
                          </Badge>
                        </div>
                        <div className="space-y-2 mb-4">
                          {order.items?.map((item, i) => (
                            <div key={i} className="flex justify-between text-sm">
                              <span className="text-[#4B5563]">{item.name} x{item.quantity}</span>
                              <span className="font-semibold text-[#0B2545]">{(item.price * item.quantity).toFixed(2)}€</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                          <span className="font-semibold text-[#0B2545]">Total</span>
                          <span className="text-2xl font-bold text-[#D08B3D]">{order.total_amount}€</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
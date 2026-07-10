import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  Home,
  XCircle,
  RotateCcw
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function OrderTimeline({ order, statusHistory = [] }) {
  const statusConfig = {
    pending: {
      icon: Clock,
      color: 'bg-yellow-500',
      label: 'En attente',
      description: 'Commande reçue'
    },
    confirmed: {
      icon: CheckCircle,
      color: 'bg-blue-500',
      label: 'Confirmée',
      description: 'Paiement validé'
    },
    processing: {
      icon: Package,
      color: 'bg-indigo-500',
      label: 'En traitement',
      description: 'Préparation en cours'
    },
    preparing: {
      icon: Package,
      color: 'bg-purple-500',
      label: 'En préparation',
      description: 'Emballage des articles'
    },
    shipped: {
      icon: Truck,
      color: 'bg-blue-600',
      label: 'Expédiée',
      description: 'Colis en route'
    },
    in_transit: {
      icon: Truck,
      color: 'bg-blue-600',
      label: 'En transit',
      description: 'Acheminement en cours'
    },
    out_for_delivery: {
      icon: MapPin,
      color: 'bg-green-500',
      label: 'En livraison',
      description: 'Le livreur est en route'
    },
    delivered: {
      icon: Home,
      color: 'bg-green-600',
      label: 'Livrée',
      description: 'Colis remis'
    },
    cancelled: {
      icon: XCircle,
      color: 'bg-red-500',
      label: 'Annulée',
      description: 'Commande annulée'
    },
    returned: {
      icon: RotateCcw,
      color: 'bg-orange-500',
      label: 'Retournée',
      description: 'Retour en cours'
    }
  };

  const currentStatus = order.status || 'pending';
  const config = statusConfig[currentStatus] || statusConfig.pending;

  // Create full timeline
  const timeline = statusHistory.length > 0 ? statusHistory : [
    {
      id: '1',
      status: currentStatus,
      created_date: order.created_date,
      location: 'Centre de traitement',
      note: 'Commande créée'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Current Status Card */}
      <Card className="rounded-[12px] border-2 border-slate-200 p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-16 h-16 ${config.color} rounded-[12px] flex items-center justify-center shadow-lg`}>
            <config.icon className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-[#0B2545]">{config.label}</h3>
            <p className="text-[#4B5563]">{config.description}</p>
          </div>
          <Badge className={`${config.color} text-white border-0 px-4 py-2 text-sm`}>
            Statut actuel
          </Badge>
        </div>

        {order.tracking_number && (
          <div className="mt-4 p-4 bg-[#F7F8FA] rounded-[10px]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#4B5563] mb-1">Numéro de suivi</p>
                <p className="text-lg font-bold text-[#0B2545] font-mono">
                  {order.tracking_number}
                </p>
              </div>
              {currentStatus === 'shipped' || currentStatus === 'in_transit' || currentStatus === 'out_for_delivery' && (
                <Badge className="bg-[#D08B3D]/10 text-[#D08B3D] border-0">
                  <Truck className="w-3 h-3 mr-1" />
                  Suivre le colis
                </Badge>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-200" />

        <div className="space-y-6">
          {timeline.map((event, index) => {
            const eventConfig = statusConfig[event.status] || statusConfig.pending;
            const isLast = index === timeline.length - 1;
            const isCurrent = event.status === currentStatus;

            return (
              <motion.div
                key={event.id || index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative pl-20"
              >
                {/* Timeline Icon */}
                <div className={`absolute left-0 w-16 h-16 ${eventConfig.color} rounded-[12px] flex items-center justify-center shadow-lg ${isCurrent ? 'ring-4 ring-[#D08B3D]/30' : ''}`}>
                  <eventConfig.icon className="w-8 h-8 text-white" />
                </div>

                {/* Timeline Content */}
                <Card className={`rounded-[12px] border-2 ${isCurrent ? 'border-[#D08B3D] bg-[#D08B3D]/5' : 'border-slate-200'} p-4`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="text-lg font-bold text-[#0B2545]">{eventConfig.label}</h4>
                      <p className="text-sm text-[#4B5563]">{eventConfig.description}</p>
                    </div>
                    {isCurrent && (
                      <Badge className="bg-[#D08B3D] text-white border-0">
                        En cours
                      </Badge>
                    )}
                  </div>

                  {event.created_date && (
                    <p className="text-sm text-slate-500 mb-2">
                      {format(new Date(event.created_date), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                    </p>
                  )}

                  {event.location && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                      <MapPin className="w-4 h-4" />
                      <span>{event.location}</span>
                    </div>
                  )}

                  {event.note && (
                    <p className="text-sm text-[#4B5563] bg-white p-3 rounded-[8px] border border-slate-200">
                      {event.note}
                    </p>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Estimated Delivery */}
      {(currentStatus === 'shipped' || currentStatus === 'in_transit' || currentStatus === 'out_for_delivery') && (
        <Card className="rounded-[12px] border-2 border-[#1E7A4B] bg-[#1E7A4B]/10 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#1E7A4B] rounded-[10px] flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-[#1E7A4B] mb-1">Livraison estimée</p>
              <p className="text-xl font-bold text-[#1E7A4B]">
                {format(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), 'dd MMMM yyyy', { locale: fr })}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
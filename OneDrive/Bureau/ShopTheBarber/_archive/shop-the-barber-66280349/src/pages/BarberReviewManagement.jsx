import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, ThumbsUp, MessageSquare, Flag } from "lucide-react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function BarberReviewManagement() {
    const reviews = [
        { id: 1, client: "Jean Dupont", rating: 5, comment: "Excellent service, très professionnel!", date: "2024-11-28", helpful: 12, avatar: null },
        { id: 2, client: "Marie Martin", rating: 4, comment: "Bonne coupe, ambiance agréable", date: "2024-11-25", helpful: 8, avatar: null },
        { id: 3, client: "Pierre Dubois", rating: 5, comment: "Toujours satisfait, je recommande", date: "2024-11-20", helpful: 15, avatar: null }
    ];

    const avgRating = (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1);

    return (
        <div className="min-h-screen py-12 bg-background-light dark:bg-background-dark font-sans">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <h1 className="text-4xl font-display font-bold text-charcoal dark:text-white mb-2">Avis Clients</h1>
                    <p className="text-lg text-slate dark:text-matte-silver">Gérez vos avis et répondez à vos clients</p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <Card className="rounded-2xl border-none shadow-soft bg-gradient-to-br from-primary to-primary/80 text-white">
                        <CardContent className="p-6 text-center">
                            <Star className="w-12 h-12 mx-auto mb-3" />
                            <p className="text-5xl font-display font-bold mb-2">{avgRating}</p>
                            <p className="text-white/80">Note Moyenne</p>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                        <CardContent className="p-6 text-center">
                            <MessageSquare className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                            <p className="text-4xl font-display font-bold text-charcoal dark:text-white mb-2">{reviews.length}</p>
                            <p className="text-slate dark:text-matte-silver">Total Avis</p>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                        <CardContent className="p-6 text-center">
                            <ThumbsUp className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
                            <p className="text-4xl font-display font-bold text-charcoal dark:text-white mb-2">
                                {reviews.reduce((sum, r) => sum + r.helpful, 0)}
                            </p>
                            <p className="text-slate dark:text-matte-silver">Votes Utiles</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-4">
                    {reviews.map((review, idx) => (
                        <motion.div key={review.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                            <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                                <CardContent className="p-6">
                                    <div className="flex items-start gap-4">
                                        <Avatar className="w-12 h-12">
                                            <AvatarImage src={review.avatar} />
                                            <AvatarFallback className="bg-primary text-white">{review.client[0]}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-2">
                                                <div>
                                                    <h3 className="font-bold text-charcoal dark:text-white">{review.client}</h3>
                                                    <p className="text-sm text-slate dark:text-matte-silver">
                                                        {new Date(review.date).toLocaleDateString('fr-FR')}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star key={i} className={`w-5 h-5 ${i < review.rating ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}`} />
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-charcoal dark:text-white mb-4">{review.comment}</p>
                                            <div className="flex items-center gap-4">
                                                <Button variant="outline" size="sm" className="rounded-lg">
                                                    <MessageSquare className="w-4 h-4 mr-2" />
                                                    Répondre
                                                </Button>
                                                <div className="flex items-center gap-2 text-sm text-slate dark:text-matte-silver">
                                                    <ThumbsUp className="w-4 h-4" />
                                                    <span>{review.helpful} personnes ont trouvé cet avis utile</span>
                                                </div>
                                                <Button variant="ghost" size="sm" className="ml-auto text-red-600 hover:text-red-700 hover:bg-red-50">
                                                    <Flag className="w-4 h-4 mr-1" />
                                                    Signaler
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}

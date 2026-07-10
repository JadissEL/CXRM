import { useBarberPortfolioEditor } from './useBarberPortfolioEditor';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Image as ImageIcon, Video, Trash2, Upload } from "lucide-react";
import { motion } from "framer-motion";

export default function BarberPortfolioEditor() {
    const { portfolioItems } = useBarberPortfolioEditor();

    return (
        <div className="min-h-screen py-12 bg-background-light dark:bg-background-dark font-sans">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-display font-bold text-charcoal dark:text-white mb-2">Mon Portfolio</h1>
                        <p className="text-lg text-slate dark:text-matte-silver">Présentez votre travail</p>
                    </div>
                    <Button className="bg-primary hover:bg-primary/90 text-white font-bold rounded-xl h-12 px-6">
                        <Upload className="w-5 h-5 mr-2" />
                        Ajouter un Média
                    </Button>
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {portfolioItems.map((item, idx) => (
                        <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                            <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark overflow-hidden group">
                                <div className="relative aspect-square bg-slate-100 dark:bg-slate-800">
                                    {item.type === 'image' ? (
                                        <img src={item.url} alt={item.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Video className="w-16 h-16 text-slate-400" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                        <Button size="sm" variant="outline" className="bg-white/90 hover:bg-white rounded-lg">
                                            Modifier
                                        </Button>
                                        <Button size="sm" variant="outline" className="bg-white/90 hover:bg-white text-red-600 rounded-lg">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                                <CardContent className="p-4">
                                    <h3 className="font-bold text-charcoal dark:text-white mb-2">{item.title}</h3>
                                    <div className="flex items-center justify-between">
                                        <Badge className="bg-primary/10 text-primary border-0">
                                            {item.type === 'image' ? <ImageIcon className="w-3 h-3 mr-1" /> : <Video className="w-3 h-3 mr-1" />}
                                            {item.type}
                                        </Badge>
                                        <span className="text-sm text-slate dark:text-matte-silver">{item.likes} likes</span>
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

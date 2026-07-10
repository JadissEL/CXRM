
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Search, MessageCircle, Phone, Mail, FileText, HelpCircle, Book, Shield, CreditCard } from "lucide-react";
import { motion } from "framer-motion";

export default function Help() {
    const [searchQuery, setSearchQuery] = React.useState("");

    const faqCategories = [
        {
            title: "Réservations",
            icon: Book,
            questions: [
                {
                    q: "Comment réserver un rendez-vous ?",
                    a: "Pour réserver un rendez-vous, recherchez un barbier, sélectionnez un service, choisissez une date et une heure, puis confirmez votre réservation."
                },
                {
                    q: "Puis-je annuler ou modifier ma réservation ?",
                    a: "Oui, vous pouvez annuler ou modifier votre réservation jusqu'à 24 heures avant l'heure prévue depuis votre tableau de bord."
                },
                {
                    q: "Que se passe-t-il si je suis en retard ?",
                    a: "Veuillez contacter directement votre barbier si vous êtes en retard. Un retard de plus de 15 minutes peut entraîner l'annulation de votre rendez-vous."
                }
            ]
        },
        {
            title: "Paiements",
            icon: CreditCard,
            questions: [
                {
                    q: "Quels modes de paiement acceptez-vous ?",
                    a: "Nous acceptons les cartes de crédit, les cartes de débit et les paiements en espèces sur place."
                },
                {
                    q: "Puis-je obtenir un remboursement ?",
                    a: "Les remboursements sont possibles en cas d'annulation au moins 24 heures à l'avance. Contactez le support pour plus d'informations."
                },
                {
                    q: "Mes informations de paiement sont-elles sécurisées ?",
                    a: "Oui, toutes les transactions sont cryptées et sécurisées. Nous ne stockons pas vos informations de carte de crédit."
                }
            ]
        },
        {
            title: "Compte",
            icon: Shield,
            questions: [
                {
                    q: "Comment créer un compte ?",
                    a: "Cliquez sur 'S'inscrire' en haut de la page et suivez les instructions pour créer votre compte."
                },
                {
                    q: "J'ai oublié mon mot de passe",
                    a: "Cliquez sur 'Mot de passe oublié' sur la page de connexion et suivez les instructions pour réinitialiser votre mot de passe."
                },
                {
                    q: "Comment supprimer mon compte ?",
                    a: "Allez dans Paramètres > Sécurité et cliquez sur 'Supprimer mon compte'. Cette action est irréversible."
                }
            ]
        }
    ];

    const contactOptions = [
        {
            icon: MessageCircle,
            title: "Chat en Direct",
            description: "Discutez avec notre équipe",
            action: "Démarrer le Chat",
            color: "text-blue-600"
        },
        {
            icon: Mail,
            title: "Email",
            description: "support@shopthebarber.com",
            action: "Envoyer un Email",
            color: "text-emerald-600"
        },
        {
            icon: Phone,
            title: "Téléphone",
            description: "+33 1 23 45 67 89",
            action: "Appeler",
            color: "text-amber-600"
        }
    ];

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark font-sans">
            {/* Hero Section */}
            <div className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 py-20 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <HelpCircle className="w-16 h-16 text-white mx-auto mb-6" />
                        <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
                            Comment pouvons-nous vous aider ?
                        </h1>
                        <div className="max-w-2xl mx-auto relative">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-slate" />
                            <Input
                                type="text"
                                placeholder="Rechercher dans l'aide..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-14 h-14 text-lg rounded-xl border-none bg-white shadow-lg"
                            />
                        </div>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-16 space-y-16">
                {/* FAQ Section */}
                <motion.section
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <h2 className="text-3xl font-display font-bold text-charcoal dark:text-white mb-8 text-center">
                        Questions Fréquentes
                    </h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        {faqCategories.map((category, idx) => (
                            <Card key={idx} className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                                            <category.icon className="w-6 h-6 text-primary" />
                                        </div>
                                        <h3 className="text-xl font-bold text-charcoal dark:text-white">{category.title}</h3>
                                    </div>
                                    <Accordion type="single" collapsible className="space-y-2">
                                        {category.questions.map((item, qIdx) => (
                                            <AccordionItem key={qIdx} value={`item-${idx}-${qIdx}`} className="border-none">
                                                <AccordionTrigger className="text-left text-sm font-medium text-charcoal dark:text-white hover:text-primary">
                                                    {item.q}
                                                </AccordionTrigger>
                                                <AccordionContent className="text-sm text-slate dark:text-matte-silver">
                                                    {item.a}
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </motion.section>

                {/* Contact Options */}
                <motion.section
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <h2 className="text-3xl font-display font-bold text-charcoal dark:text-white mb-8 text-center">
                        Besoin d'Aide Supplémentaire ?
                    </h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        {contactOptions.map((option, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                            >
                                <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark hover:shadow-soft-md transition-all group">
                                    <CardContent className="p-6 text-center">
                                        <div className={`w-16 h-16 ${option.color} bg-current/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                                            <option.icon className={`w-8 h-8 ${option.color}`} />
                                        </div>
                                        <h3 className="text-xl font-bold text-charcoal dark:text-white mb-2">{option.title}</h3>
                                        <p className="text-slate dark:text-matte-silver mb-4">{option.description}</p>
                                        <Button className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl">
                                            {option.action}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </motion.section>

                {/* Resources */}
                <motion.section
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="bg-gradient-to-br from-primary/5 to-transparent p-8 md:p-12 rounded-3xl border border-primary/10"
                >
                    <div className="text-center max-w-2xl mx-auto">
                        <FileText className="w-12 h-12 text-primary mx-auto mb-4" />
                        <h2 className="text-2xl font-display font-bold text-charcoal dark:text-white mb-4">
                            Documentation et Guides
                        </h2>
                        <p className="text-lg text-slate dark:text-matte-silver mb-6">
                            Consultez notre documentation complète pour en savoir plus sur l'utilisation de ShopTheBarber
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to={createPageUrl("About")}>
                                <Button variant="outline" className="border-2 border-primary text-primary hover:bg-primary/10 rounded-xl">
                                    Guide d'Utilisation
                                </Button>
                            </Link>
                            <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl">
                                Conditions d'Utilisation
                            </Button>
                        </div>
                    </div>
                </motion.section>
            </div>
        </div>
    );
}

import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Award, TrendingUp, Heart, Shield, Sparkles } from "lucide-react";

export default function About() {
    const values = [
        {
            icon: Award,
            title: "Professionnalisme",
            description: "Nous maintenons les plus hauts standards de service et de conduite."
        },
        {
            icon: Sparkles,
            title: "Qualité",
            description: "Nous nous engageons à offrir des expériences de coiffure exceptionnelles."
        },
        {
            icon: Shield,
            title: "Confiance",
            description: "Nous construisons des relations durables basées sur la fiabilité et la transparence."
        },
        {
            icon: TrendingUp,
            title: "Innovation",
            description: "Nous améliorons continuellement notre plateforme pour répondre aux besoins évolutifs de nos utilisateurs."
        },
        {
            icon: Heart,
            title: "Communauté",
            description: "Nous favorisons un environnement de soutien pour les clients, les barbiers et les gérants."
        }
    ];

    const benefits = [
        {
            title: "Avantages pour les Clients",
            description: "Les clients peuvent facilement découvrir et réserver des rendez-vous avec des barbiers de premier ordre dans leur région. Notre plateforme offre une large sélection de services, des profils détaillés de barbiers et des avis d'utilisateurs pour aider les clients à prendre des décisions éclairées."
        },
        {
            title: "Avantages pour les Barbiers",
            description: "Les barbiers peuvent gérer leurs horaires, réservations de clients et paiements efficacement via notre plateforme. Nous fournissons des outils pour mettre en valeur leurs compétences, développer leur clientèle et faire croître leur entreprise."
        },
        {
            title: "Avantages pour les Gérants",
            description: "Les gérants peuvent superviser les opérations de leur salon de coiffure, gérer les horaires du personnel et suivre les performances commerciales avec nos outils de gestion complets."
        }
    ];

    return (
        <div className="min-h-screen bg-background-dark font-sans">
            {/* Hero Section */}
            <div className="relative bg-gradient-to-br from-charcoal via-background-dark to-charcoal py-20 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-5xl font-display font-bold text-white mb-6"
                    >
                        À Propos de ShopTheBarber
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-lg md:text-xl text-matte-silver leading-relaxed max-w-3xl mx-auto"
                    >
                        ShopTheBarber est un écosystème professionnel de réservation de coiffure conçu pour les hommes et les garçons.
                        Notre plateforme connecte les clients avec des barbiers qualifiés et fournit des outils pour que les barbiers
                        et les gérants rationalisent leurs opérations.
                    </motion.p>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-16 space-y-20">
                {/* Mission Section */}
                <motion.section
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="space-y-6"
                >
                    <h2 className="text-3xl font-display font-bold text-white mb-4">Notre Mission</h2>
                    <p className="text-lg text-matte-silver leading-relaxed">
                        Notre mission est de révolutionner l'industrie de la coiffure en fournissant une plateforme conviviale
                        qui profite aux clients, aux barbiers et aux gérants. Nous visons à créer une communauté où les clients
                        peuvent facilement trouver et réserver leur service de coiffure idéal, où les barbiers peuvent gérer
                        leurs horaires et clients efficacement, et où les gérants peuvent superviser leurs opérations commerciales
                        avec facilité.
                    </p>
                </motion.section>

                {/* Values Section */}
                <motion.section
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="space-y-8"
                >
                    <h2 className="text-3xl font-display font-bold text-white mb-8">Nos Valeurs</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {values.map((value, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-surface-dark p-6 rounded-2xl border border-slate/10 hover:border-primary/30 transition-all group"
                            >
                                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                                    <value.icon className="w-6 h-6 text-primary" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">{value.title}</h3>
                                <p className="text-matte-silver leading-relaxed">{value.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.section>

                {/* Benefits Section */}
                <motion.section
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="space-y-8"
                >
                    <h2 className="text-3xl font-display font-bold text-white mb-8">Avantages de la Plateforme</h2>
                    <div className="space-y-6">
                        {benefits.map((benefit, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-surface-dark p-8 rounded-2xl border border-slate/10"
                            >
                                <h3 className="text-2xl font-bold text-white mb-4">{benefit.title}</h3>
                                <p className="text-lg text-matte-silver leading-relaxed">{benefit.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.section>

                {/* Brand Story Section */}
                <motion.section
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="space-y-6 bg-gradient-to-br from-primary/5 to-transparent p-8 md:p-12 rounded-3xl border border-primary/10"
                >
                    <h2 className="text-3xl font-display font-bold text-white mb-4">Notre Histoire</h2>
                    <p className="text-lg text-matte-silver leading-relaxed">
                        ShopTheBarber a été fondé avec la vision de transformer l'industrie de la coiffure. Inspirés par le besoin
                        d'une expérience de réservation plus rationalisée et professionnelle, nous nous sommes lancés dans la création
                        d'une plateforme qui répond aux besoins uniques des clients, des barbiers et des gérants. Notre parcours a été
                        guidé par une passion pour l'excellence et un engagement envers l'innovation, aboutissant à une plateforme à la
                        fois puissante et conviviale.
                    </p>
                </motion.section>

                {/* CTA Section */}
                <motion.section
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center py-12"
                >
                    <h2 className="text-3xl font-display font-bold text-white mb-6">Prêt à Commencer ?</h2>
                    <p className="text-lg text-matte-silver mb-8 max-w-2xl mx-auto">
                        Rejoignez des milliers d'utilisateurs satisfaits et découvrez la meilleure expérience de réservation de coiffure.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link to={createPageUrl("Barbers")}>
                            <Button className="bg-primary hover:bg-primary/90 text-white font-bold px-8 py-6 text-lg rounded-xl shadow-lg shadow-primary/25">
                                Trouver un Barbier
                            </Button>
                        </Link>
                        <Link to={createPageUrl("Home")}>
                            <Button variant="outline" className="border-2 border-white/20 text-white hover:bg-white/10 font-bold px-8 py-6 text-lg rounded-xl">
                                En Savoir Plus
                            </Button>
                        </Link>
                    </div>
                </motion.section>
            </div>
        </div>
    );
}

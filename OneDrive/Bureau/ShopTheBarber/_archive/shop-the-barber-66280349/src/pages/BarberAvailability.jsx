import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { Calendar as CalendarIcon, Plus, Edit } from "lucide-react";
import { motion } from "framer-motion";
import { fr } from "date-fns/locale";

export default function BarberAvailability() {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [workingHours, setWorkingHours] = useState({
        monday: { enabled: true, start: "09:00", end: "18:00" },
        tuesday: { enabled: true, start: "09:00", end: "18:00" },
        wednesday: { enabled: true, start: "09:00", end: "18:00" },
        thursday: { enabled: true, start: "09:00", end: "18:00" },
        friday: { enabled: true, start: "09:00", end: "18:00" },
        saturday: { enabled: true, start: "10:00", end: "16:00" },
        sunday: { enabled: false, start: "10:00", end: "16:00" }
    });

    const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    const dayLabels = { monday: "Lundi", tuesday: "Mardi", wednesday: "Mercredi", thursday: "Jeudi", friday: "Vendredi", saturday: "Samedi", sunday: "Dimanche" };

    return (
        <div className="min-h-screen py-12 bg-background-light dark:bg-background-dark font-sans">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <h1 className="text-4xl font-display font-bold text-charcoal dark:text-white mb-2">Disponibilités</h1>
                    <p className="text-lg text-slate dark:text-matte-silver">Gérez vos horaires de travail</p>
                </motion.div>

                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                            <CardContent className="p-6">
                                <h3 className="text-xl font-bold text-charcoal dark:text-white mb-6">Horaires Hebdomadaires</h3>
                                <div className="space-y-4">
                                    {days.map(day => (
                                        <div key={day} className="flex items-center gap-4 p-4 bg-background-light dark:bg-background-dark rounded-xl">
                                            <Switch checked={workingHours[day].enabled} onCheckedChange={(checked) => setWorkingHours(prev => ({ ...prev, [day]: { ...prev[day], enabled: checked } }))} />
                                            <div className="flex-1">
                                                <p className="font-bold text-charcoal dark:text-white">{dayLabels[day]}</p>
                                                {workingHours[day].enabled && (
                                                    <p className="text-sm text-slate dark:text-matte-silver">{workingHours[day].start} - {workingHours[day].end}</p>
                                                )}
                                            </div>
                                            {workingHours[day].enabled && (
                                                <Button variant="outline" size="sm" className="rounded-lg">
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                            <CardContent className="p-6">
                                <h3 className="text-xl font-bold text-charcoal dark:text-white mb-4">Calendrier</h3>
                                <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} locale={fr} className="rounded-xl" />
                            </CardContent>
                        </Card>

                        <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                            <CardContent className="p-6">
                                <h3 className="text-xl font-bold text-charcoal dark:text-white mb-4">Actions Rapides</h3>
                                <div className="space-y-3">
                                    <Button className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Ajouter une Absence
                                    </Button>
                                    <Button variant="outline" className="w-full rounded-xl">
                                        <CalendarIcon className="w-4 h-4 mr-2" />
                                        Jours Fériés
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}

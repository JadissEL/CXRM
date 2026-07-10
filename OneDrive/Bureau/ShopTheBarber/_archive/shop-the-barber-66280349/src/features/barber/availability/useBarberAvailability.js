import { useState, useMemo } from 'react';

export function useBarberAvailability() {
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
    const dayLabels = {
        monday: "Lundi", tuesday: "Mardi", wednesday: "Mercredi",
        thursday: "Jeudi", friday: "Vendredi", saturday: "Samedi", sunday: "Dimanche"
    };

    const toggleDay = (day, enabled) => {
        setWorkingHours(prev => ({ ...prev, [day]: { ...prev[day], enabled } }));
    };

    return {
        selectedDate,
        setSelectedDate,
        workingHours,
        setWorkingHours,
        days,
        dayLabels,
        toggleDay,
        isLoading: false,
        error: null
    };
}

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function useSettings() {
    const queryClient = useQueryClient();
    const [isDarkMode, setIsDarkMode] = useState(() => {
        return localStorage.getItem('theme') === 'dark';
    });

    const { data: user, isLoading } = useQuery({
        queryKey: ['current-user'],
        queryFn: () => base44.auth.me()
    });

    const [formData, setFormData] = useState({
        full_name: user?.full_name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        address: user?.address || ''
    });

    const toggleDarkMode = () => {
        const newMode = !isDarkMode;
        setIsDarkMode(newMode);
        localStorage.setItem('theme', newMode ? 'dark' : 'light');
        document.documentElement.classList.toggle('dark', newMode);
    };

    const updateProfileMutation = useMutation({
        mutationFn: (data) => base44.entities.User.update(user.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['current-user'] });
        },
        onError: (error) => {
            console.error('Profile update failed:', error);
        }
    });

    const handleProfileUpdate = (e) => {
        e.preventDefault();
        updateProfileMutation.mutate(formData);
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return {
        user,
        formData,
        isDarkMode,
        toggleDarkMode,
        handleProfileUpdate,
        handleChange,
        updateProfileMutation,
        isLoading,
        error: null
    };
}

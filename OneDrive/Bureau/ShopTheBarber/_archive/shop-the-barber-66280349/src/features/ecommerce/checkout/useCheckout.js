import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function useCheckout() {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        email: '',
        firstName: '',
        lastName: '',
        address: '',
        city: '',
        postalCode: '',
        phone: ''
    });

    const { data: user } = useQuery({
        queryKey: ['current-user'],
        queryFn: () => base44.auth.me()
    });

    const createOrderMutation = useMutation({
        mutationFn: (orderData) => base44.entities.Order.create(orderData),
        onSuccess: (data) => {
            // Order created successfully
            console.log('Order created:', data);
        },
        onError: (error) => {
            console.error('Order creation failed:', error);
        }
    });

    const handlePaymentSuccess = (paymentData) => {
        createOrderMutation.mutate({
            ...formData,
            ...paymentData,
            user_id: user?.id
        });
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const isStep1Valid = () => {
        return formData.email && formData.firstName && formData.lastName;
    };

    return {
        currentStep,
        setCurrentStep,
        formData,
        handleChange,
        handlePaymentSuccess,
        isStep1Valid,
        createOrderMutation,
        user,
        isLoading: false,
        error: null
    };
}

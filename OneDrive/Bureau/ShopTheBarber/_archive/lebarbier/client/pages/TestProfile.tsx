import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import ProfileForm from '../components/profile/ProfileForm';
import AddressForm from '../components/profile/AddressForm';
import PaymentMethodForm from '../components/profile/PaymentMethodForm';
import FavoritesList from '../components/profile/FavoritesList';

const queryClient = new QueryClient();

const TestProfile: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Test Profile Components</h1>
            <p className="text-muted-foreground">
              Testing the User Profile components functionality.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Profile Form</h2>
              <ProfileForm 
                profile={{
                  id: 1,
                  email: 'test@example.com',
                  firstName: 'Test',
                  lastName: 'User',
                  phone: '+1234567890',
                  city: 'Test City',
                  role: 'client',
                  avatarUrl: '',
                  dateOfBirth: '1990-01-01',
                  gender: 'other',
                  preferences: {
                    notifications: true,
                    marketing: false,
                    language: 'en'
                  }
                }}
                onUpdate={(data) => console.log('Profile update:', data)}
                isLoading={false}
              />
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Address Form</h2>
              <AddressForm />
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Payment Method Form</h2>
              <PaymentMethodForm />
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Favorites List</h2>
              <FavoritesList />
            </div>
          </div>
        </div>
        <Toaster />
      </div>
    </QueryClientProvider>
  );
};

export default TestProfile; 
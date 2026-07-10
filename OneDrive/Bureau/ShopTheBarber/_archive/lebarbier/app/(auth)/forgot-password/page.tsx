import { PasswordRecovery } from '@/components/auth/PasswordRecovery';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reset Password | ShopTheBarber',
  description: 'Reset your password to regain access to your ShopTheBarber account.',
};

export default function ForgotPasswordPage() {
  return <PasswordRecovery />;
}
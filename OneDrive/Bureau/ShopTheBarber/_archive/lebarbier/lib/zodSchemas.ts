import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  phone: z.string().min(8),
  role: z.enum(['client', 'barber', 'admin']),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
}); 
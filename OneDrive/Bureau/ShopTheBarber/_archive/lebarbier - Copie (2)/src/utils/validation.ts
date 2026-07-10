import { z } from 'zod';
import { ValidationResult, ValidationError } from '@/types';

// Common validation schemas
export const emailSchema = z.string().email('Invalid email address');
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');
export const phoneSchema = z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number');
export const nameSchema = z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name too long');

// User validation schemas
export const signUpSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  phone: phoneSchema.optional(),
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const profileUpdateSchema = z.object({
  name: nameSchema.optional(),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
});

// Booking validation schemas
export const bookingSchema = z.object({
  barber_id: z.string().uuid('Invalid barber ID'),
  service_id: z.string().uuid('Invalid service ID'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
  notes: z.string().max(500, 'Notes too long').optional(),
});

// Search validation schemas
export const searchSchema = z.object({
  location: z.string().min(1, 'Location is required'),
  service: z.string().optional(),
  date: z.string().optional(),
  time: z.string().optional(),
  radius: z.number().min(1).max(100).optional(),
});

// Service validation schemas
export const serviceSchema = z.object({
  name: z.string().min(1, 'Service name is required').max(100, 'Service name too long'),
  description: z.string().max(500, 'Description too long'),
  price: z.number().positive('Price must be positive'),
  duration: z.number().positive('Duration must be positive').max(480, 'Duration too long'),
  category: z.string().min(1, 'Category is required'),
});

// Barber validation schemas
export const barberSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  address: z.string().min(1, 'Address is required'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  description: z.string().max(1000, 'Description too long').optional(),
  services: z.array(z.string()).min(1, 'At least one service is required'),
});

// Generic validation function
export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult {
  try {
    schema.parse(data);
    return {
      isValid: true,
      errors: [],
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: ValidationError[] = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return {
        isValid: false,
        errors,
      };
    }
    return {
      isValid: false,
      errors: [{ field: 'unknown', message: 'Validation failed' }],
    };
  }
}

// Safe validation function that doesn't throw
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: ValidationError[] } {
  try {
    const parsed = schema.parse(data);
    return { success: true, data: parsed };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: ValidationError[] = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return { success: false, errors };
    }
    return {
      success: false,
      errors: [{ field: 'unknown', message: 'Validation failed' }],
    };
  }
}

// Partial validation for optional fields
export function validatePartial<T>(
  schema: z.ZodSchema<T>,
  data: Partial<T>
): ValidationResult {
  // Only apply partial() to object schemas
  if (schema instanceof z.ZodObject) {
    const partialSchema = schema.partial();
    return validate(partialSchema, data);
  }
  // For non-object schemas, just validate normally
  return validate(schema, data);
}

// Custom validation functions
export function validateEmail(email: string): boolean {
  return emailSchema.safeParse(email).success;
}

export function validatePassword(password: string): boolean {
  return passwordSchema.safeParse(password).success;
}

export function validatePhone(phone: string): boolean {
  return phoneSchema.safeParse(phone).success;
}

export function validateName(name: string): boolean {
  return nameSchema.safeParse(name).success;
}

// Date and time validation
export function validateDate(date: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;
  
  const dateObj = new Date(date);
  return !isNaN(dateObj.getTime()) && dateObj >= new Date();
}

export function validateTime(time: string): boolean {
  const timeRegex = /^\d{2}:\d{2}$/;
  if (!timeRegex.test(time)) return false;
  
  const [hours, minutes] = time.split(':').map(Number);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

export function validateDateTime(date: string, time: string): boolean {
  return validateDate(date) && validateTime(time);
}

// File validation
export function validateFile(
  file: File,
  maxSize: number = 5 * 1024 * 1024, // 5MB
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp']
): ValidationResult {
  const errors: ValidationError[] = [];

  if (file.size > maxSize) {
    errors.push({
      field: 'file',
      message: `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`,
    });
  }

  if (!allowedTypes.includes(file.type)) {
    errors.push({
      field: 'file',
      message: `File type must be one of: ${allowedTypes.join(', ')}`,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// URL validation
export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Price validation
export function validatePrice(price: number): boolean {
  return price > 0 && price <= 10000; // Max $10,000
}

// Duration validation (in minutes)
export function validateDuration(duration: number): boolean {
  return duration > 0 && duration <= 480; // Max 8 hours
}

// Export all schemas for use in components
export const schemas = {
  email: emailSchema,
  password: passwordSchema,
  phone: phoneSchema,
  name: nameSchema,
  signUp: signUpSchema,
  signIn: signInSchema,
  profileUpdate: profileUpdateSchema,
  booking: bookingSchema,
  search: searchSchema,
  service: serviceSchema,
  barber: barberSchema,
}; 
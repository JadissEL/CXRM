import { z } from 'zod';

// User Profile Schema
export const userProfileSchema = z.object({
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  preferences: z.record(z.any()).optional(),
  emergencyContactName: z.string().min(2, 'Emergency contact name must be at least 2 characters').optional(),
  emergencyContactPhone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format').optional(),
  emergencyContactRelationship: z.string().min(2, 'Relationship must be at least 2 characters').optional(),
});

export type UserProfile = z.infer<typeof userProfileSchema>;

// User Address Schema
export const userAddressSchema = z.object({
  addressType: z.enum(['home', 'work', 'other']).default('home'),
  isDefault: z.boolean().default(false),
  streetAddress: z.string().min(5, 'Street address must be at least 5 characters'),
  city: z.string().min(2, 'City must be at least 2 characters'),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().default('Morocco'),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export type UserAddress = z.infer<typeof userAddressSchema>;

// User Payment Method Schema
export const userPaymentMethodSchema = z.object({
  paymentType: z.enum(['card', 'paypal', 'apple_pay', 'google_pay']),
  isDefault: z.boolean().default(false),
  cardLastFour: z.string().length(4, 'Card last four must be exactly 4 digits').optional(),
  cardBrand: z.enum(['visa', 'mastercard', 'amex', 'discover']).optional(),
  cardExpiryMonth: z.number().min(1).max(12).optional(),
  cardExpiryYear: z.number().min(new Date().getFullYear()).optional(),
  paypalEmail: z.string().email('Invalid PayPal email').optional(),
  paymentToken: z.string().optional(),
  isActive: z.boolean().default(true),
});

export type UserPaymentMethod = z.infer<typeof userPaymentMethodSchema>;

// User Favorite Schema
export const userFavoriteSchema = z.object({
  favoriteType: z.enum(['barber', 'service', 'product']),
  favoriteId: z.number().positive('Favorite ID must be positive'),
  notes: z.string().max(200, 'Notes must be less than 200 characters').optional(),
});

export type UserFavorite = z.infer<typeof userFavoriteSchema>;

// Complete User Profile Schema (combines all profile data)
export const completeUserProfileSchema = z.object({
  // Basic user info
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format').optional(),
  avatarUrl: z.string().url('Invalid avatar URL').optional(),
  
  // Extended profile
  profile: userProfileSchema.optional(),
  
  // Addresses
  addresses: z.array(userAddressSchema).optional(),
  
  // Payment methods
  paymentMethods: z.array(userPaymentMethodSchema).optional(),
  
  // Favorites
  favorites: z.array(userFavoriteSchema).optional(),
});

export type CompleteUserProfile = z.infer<typeof completeUserProfileSchema>;

// Profile update schema (partial updates)
export const profileUpdateSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  avatarUrl: z.string().url().optional(),
  profile: userProfileSchema.partial().optional(),
});

export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;

// Address update schema
export const addressUpdateSchema = userAddressSchema.partial().extend({
  id: z.number().optional(), // For updates
});

export type AddressUpdate = z.infer<typeof addressUpdateSchema>;

// Payment method update schema
export const paymentMethodUpdateSchema = userPaymentMethodSchema.partial().extend({
  id: z.number().optional(), // For updates
});

export type PaymentMethodUpdate = z.infer<typeof paymentMethodUpdateSchema>;

// Favorite update schema
export const favoriteUpdateSchema = userFavoriteSchema.partial().extend({
  id: z.number().optional(), // For updates
});

export type FavoriteUpdate = z.infer<typeof favoriteUpdateSchema>; 
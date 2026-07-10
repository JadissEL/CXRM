import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileUpdateSchema, ProfileUpdate } from '../../../shared/schemas';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import { Calendar, User, Phone, Mail, MapPin, Shield, Loader2 } from 'lucide-react';

interface ProfileFormProps {
  profile: any;
  onUpdate: (data: ProfileUpdate) => void;
  isLoading?: boolean;
}

export default function ProfileForm({ profile, onUpdate, isLoading = false }: ProfileFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
    watch,
  } = useForm<ProfileUpdate>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      phone: profile?.phone || '',
      avatarUrl: profile?.avatarUrl || '',
      profile: {
        dateOfBirth: profile?.profile?.dateOfBirth || '',
        gender: profile?.profile?.gender || undefined,
        bio: profile?.profile?.bio || '',
        emergencyContactName: profile?.profile?.emergencyContactName || '',
        emergencyContactPhone: profile?.profile?.emergencyContactPhone || '',
        emergencyContactRelationship: profile?.profile?.emergencyContactRelationship || '',
      },
    },
  });

  const onSubmit = (data: ProfileUpdate) => {
    onUpdate(data);
  };

  const gender = watch('profile.gender');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informations de Base
          </CardTitle>
          <CardDescription>
            Vos informations personnelles principales
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Prénom *</Label>
              <Input
                id="firstName"
                {...register('firstName')}
                placeholder="Votre prénom"
              />
              {errors.firstName && (
                <p className="text-sm text-destructive">{errors.firstName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Nom *</Label>
              <Input
                id="lastName"
                {...register('lastName')}
                placeholder="Votre nom"
              />
              {errors.lastName && (
                <p className="text-sm text-destructive">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  value={profile?.email || ''}
                  disabled
                  className="bg-muted"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                L'email ne peut pas être modifié
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  {...register('phone')}
                  placeholder="+212 6 12 34 56 78"
                />
              </div>
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatarUrl">URL de l'avatar</Label>
            <Input
              id="avatarUrl"
              {...register('avatarUrl')}
              placeholder="https://example.com/avatar.jpg"
            />
            {errors.avatarUrl && (
              <p className="text-sm text-destructive">{errors.avatarUrl.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Extended Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Profil Étendu
          </CardTitle>
          <CardDescription>
            Informations supplémentaires sur votre profil
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date de naissance</Label>
              <Input
                id="dateOfBirth"
                type="date"
                {...register('profile.dateOfBirth')}
              />
              {errors.profile?.dateOfBirth && (
                <p className="text-sm text-destructive">{errors.profile.dateOfBirth.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Genre</Label>
              <Select
                value={gender}
                onValueChange={(value) => setValue('profile.gender', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez votre genre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Homme</SelectItem>
                  <SelectItem value="female">Femme</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                  <SelectItem value="prefer_not_to_say">Préfère ne pas dire</SelectItem>
                </SelectContent>
              </Select>
              {errors.profile?.gender && (
                <p className="text-sm text-destructive">{errors.profile.gender.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              {...register('profile.bio')}
              placeholder="Parlez-nous un peu de vous..."
              rows={3}
            />
            {errors.profile?.bio && (
              <p className="text-sm text-destructive">{errors.profile.bio.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Contact d'Urgence
          </CardTitle>
          <CardDescription>
            Informations de contact en cas d'urgence
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emergencyContactName">Nom du contact</Label>
              <Input
                id="emergencyContactName"
                {...register('profile.emergencyContactName')}
                placeholder="Nom complet"
              />
              {errors.profile?.emergencyContactName && (
                <p className="text-sm text-destructive">{errors.profile.emergencyContactName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergencyContactPhone">Téléphone du contact</Label>
              <Input
                id="emergencyContactPhone"
                {...register('profile.emergencyContactPhone')}
                placeholder="+212 6 12 34 56 78"
              />
              {errors.profile?.emergencyContactPhone && (
                <p className="text-sm text-destructive">{errors.profile.emergencyContactPhone.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="emergencyContactRelationship">Relation</Label>
            <Input
              id="emergencyContactRelationship"
              {...register('profile.emergencyContactRelationship')}
              placeholder="Ex: Époux, Parent, Ami..."
            />
            {errors.profile?.emergencyContactRelationship && (
              <p className="text-sm text-destructive">{errors.profile.emergencyContactRelationship.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={!isDirty || isLoading}
          className="min-w-[120px]"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Mise à jour...
            </>
          ) : (
            'Sauvegarder'
          )}
        </Button>
      </div>
    </form>
  );
} 
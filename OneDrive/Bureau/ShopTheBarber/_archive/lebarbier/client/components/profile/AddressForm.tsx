import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { userAddressSchema, UserAddress } from '../../../shared/schemas';
import { profileAPI } from '../../../shared/api';
import { useToast } from '../../hooks/use-toast';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Loader2, Plus, Edit, Trash2, MapPin, Home, Building, Map } from 'lucide-react';

export default function AddressForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingAddress, setEditingAddress] = React.useState<any>(null);

  // Fetch addresses
  const { data: addresses = [], isLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: async () => {
      const response = await profileAPI.getAddresses();
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data || [];
    },
  });

  // Add address mutation
  const addAddressMutation = useMutation({
    mutationFn: async (data: UserAddress) => {
      const response = await profileAPI.addAddress(data);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setIsDialogOpen(false);
      toast({
        title: "Adresse ajoutée",
        description: "Votre adresse a été ajoutée avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur s'est produite lors de l'ajout de l'adresse.",
        variant: "destructive",
      });
    },
  });

  // Update address mutation
  const updateAddressMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<UserAddress> }) => {
      const response = await profileAPI.updateAddress(id, data);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setIsDialogOpen(false);
      setEditingAddress(null);
      toast({
        title: "Adresse mise à jour",
        description: "Votre adresse a été mise à jour avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur s'est produite lors de la mise à jour de l'adresse.",
        variant: "destructive",
      });
    },
  });

  // Delete address mutation
  const deleteAddressMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await profileAPI.deleteAddress(id);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast({
        title: "Adresse supprimée",
        description: "Votre adresse a été supprimée avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur s'est produite lors de la suppression de l'adresse.",
        variant: "destructive",
      });
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<UserAddress>({
    resolver: zodResolver(userAddressSchema),
    defaultValues: {
      addressType: 'home',
      isDefault: false,
      country: 'Morocco',
    },
  });

  const addressType = watch('addressType');

  const onSubmit = (data: UserAddress) => {
    if (editingAddress) {
      updateAddressMutation.mutate({ id: editingAddress.id, data });
    } else {
      addAddressMutation.mutate(data);
    }
  };

  const handleEdit = (address: any) => {
    setEditingAddress(address);
    setValue('addressType', address.addressType);
    setValue('isDefault', address.isDefault);
    setValue('streetAddress', address.streetAddress);
    setValue('city', address.city);
    setValue('state', address.state);
    setValue('postalCode', address.postalCode);
    setValue('country', address.country);
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingAddress(null);
    reset();
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette adresse ?')) {
      deleteAddressMutation.mutate(id);
    }
  };

  const getAddressIcon = (type: string) => {
    switch (type) {
      case 'home':
        return <Home className="h-4 w-4" />;
      case 'work':
        return <Building className="h-4 w-4" />;
      default:
        return <Map className="h-4 w-4" />;
    }
  };

  const getAddressTypeLabel = (type: string) => {
    switch (type) {
      case 'home':
        return 'Domicile';
      case 'work':
        return 'Travail';
      default:
        return 'Autre';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Address List */}
      <div className="space-y-4">
        {addresses.map((address: any) => (
          <Card key={address.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {getAddressIcon(address.addressType)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{getAddressTypeLabel(address.addressType)}</h3>
                      {address.isDefault && (
                        <Badge variant="secondary" className="text-xs">
                          Par défaut
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {address.streetAddress}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {address.city}{address.state && `, ${address.state}`}{address.postalCode && ` ${address.postalCode}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {address.country}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(address)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(address.id)}
                    disabled={deleteAddressMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {addresses.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucune adresse</h3>
              <p className="text-muted-foreground mb-4">
                Ajoutez votre première adresse pour faciliter vos rendez-vous.
              </p>
              <Button onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une adresse
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Address Button */}
      {addresses.length > 0 && (
        <Button onClick={handleAdd} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une adresse
        </Button>
      )}

      {/* Add/Edit Address Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingAddress ? 'Modifier l\'adresse' : 'Ajouter une adresse'}
            </DialogTitle>
            <DialogDescription>
              {editingAddress ? 'Modifiez les informations de votre adresse.' : 'Ajoutez une nouvelle adresse à votre profil.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="addressType">Type d'adresse</Label>
              <Select
                value={addressType}
                onValueChange={(value) => setValue('addressType', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="home">Domicile</SelectItem>
                  <SelectItem value="work">Travail</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
              {errors.addressType && (
                <p className="text-sm text-destructive">{errors.addressType.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="streetAddress">Adresse *</Label>
              <Input
                id="streetAddress"
                {...register('streetAddress')}
                placeholder="123 Rue de la Paix"
              />
              {errors.streetAddress && (
                <p className="text-sm text-destructive">{errors.streetAddress.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Ville *</Label>
                <Input
                  id="city"
                  {...register('city')}
                  placeholder="Casablanca"
                />
                {errors.city && (
                  <p className="text-sm text-destructive">{errors.city.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="postalCode">Code postal</Label>
                <Input
                  id="postalCode"
                  {...register('postalCode')}
                  placeholder="20000"
                />
                {errors.postalCode && (
                  <p className="text-sm text-destructive">{errors.postalCode.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">Région/Province</Label>
              <Input
                id="state"
                {...register('state')}
                placeholder="Grand Casablanca"
              />
              {errors.state && (
                <p className="text-sm text-destructive">{errors.state.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Pays</Label>
              <Input
                id="country"
                {...register('country')}
                placeholder="Morocco"
              />
              {errors.country && (
                <p className="text-sm text-destructive">{errors.country.message}</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isDefault"
                {...register('isDefault')}
                className="rounded"
              />
              <Label htmlFor="isDefault">Définir comme adresse par défaut</Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={addAddressMutation.isPending || updateAddressMutation.isPending}
              >
                {addAddressMutation.isPending || updateAddressMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {editingAddress ? 'Mise à jour...' : 'Ajout...'}
                  </>
                ) : (
                  editingAddress ? 'Mettre à jour' : 'Ajouter'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../../ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '../../ui/dialog';
import { 
  Heart, 
  Plus, 
  Edit, 
  Trash2, 
  Loader2,
  Star
} from 'lucide-react';
import { profileAPI } from '../../../shared/api';
import type { Favorite } from '../../../shared/schemas';

const favoriteSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['service', 'product', 'location']),
  description: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
  notes: z.string().optional()
});

type FavoriteFormData = z.infer<typeof favoriteSchema>;

const FavoritesList: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFavorite, setEditingFavorite] = useState<Favorite | null>(null);
  const queryClient = useQueryClient();

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ['favorites'],
    queryFn: profileAPI.getFavorites
  });

  const createMutation = useMutation({
    mutationFn: (data: FavoriteFormData) => profileAPI.createFavorite(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      toast.success('Favorite added successfully');
      setIsDialogOpen(false);
      reset();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add favorite');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: FavoriteFormData }) =>
      profileAPI.updateFavorite(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      toast.success('Favorite updated successfully');
      setIsDialogOpen(false);
      setEditingFavorite(null);
      reset();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update favorite');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => profileAPI.deleteFavorite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      toast.success('Favorite deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete favorite');
    }
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FavoriteFormData>({
    resolver: zodResolver(favoriteSchema),
    defaultValues: {
      name: '',
      type: 'service',
      description: '',
      rating: 5,
      notes: ''
    }
  });

  const onSubmit = (data: FavoriteFormData) => {
    if (editingFavorite) {
      updateMutation.mutate({ id: editingFavorite.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (favorite: Favorite) => {
    setEditingFavorite(favorite);
    reset({
      name: favorite.name,
      type: favorite.type,
      description: favorite.description || '',
      rating: favorite.rating || 5,
      notes: favorite.notes || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    setEditingFavorite(null);
    reset();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'service':
        return <Heart className="h-4 w-4 text-red-500" />;
      case 'product':
        return <Star className="h-4 w-4 text-yellow-500" />;
      case 'location':
        return <Heart className="h-4 w-4 text-blue-500" />;
      default:
        return <Heart className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'service':
        return 'Service';
      case 'product':
        return 'Product';
      case 'location':
        return 'Location';
      default:
        return type;
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Favorites
          </CardTitle>
          <CardDescription>
            Manage your favorite services, products, and locations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Favorites
            </CardTitle>
            <CardDescription>
              Manage your favorite services, products, and locations
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Favorite
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingFavorite ? 'Edit Favorite' : 'Add Favorite'}
                </DialogTitle>
                <DialogDescription>
                  {editingFavorite 
                    ? 'Update your favorite item details below.'
                    : 'Add a new favorite service, product, or location.'
                  }
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Controller
                    name="name"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="Enter name"
                      />
                    )}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Controller
                    name="type"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="service">Service</SelectItem>
                          <SelectItem value="product">Product</SelectItem>
                          <SelectItem value="location">Location</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.type && (
                    <p className="text-sm text-red-500">{errors.type.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="Enter description"
                      />
                    )}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-500">{errors.description.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rating">Rating (Optional)</Label>
                  <Controller
                    name="rating"
                    control={control}
                    render={({ field }) => (
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        value={field.value?.toString()}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select rating" />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5].map(rating => (
                            <SelectItem key={rating} value={rating.toString()}>
                              {rating} Star{rating !== 1 ? 's' : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.rating && (
                    <p className="text-sm text-red-500">{errors.rating.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Controller
                    name="notes"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="Enter notes"
                      />
                    )}
                  />
                  {errors.notes && (
                    <p className="text-sm text-red-500">{errors.notes.message}</p>
                  )}
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingFavorite ? 'Update' : 'Add'} Favorite
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {favorites.length === 0 ? (
          <div className="text-center py-8">
            <Heart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No favorites</h3>
            <p className="text-gray-500 mb-4">
              Add your favorite services, products, or locations
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Favorite
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {favorites.map((favorite) => (
              <div
                key={favorite.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {getTypeIcon(favorite.type)}
                  <div>
                    <p className="font-medium">{favorite.name}</p>
                    <p className="text-sm text-gray-500">
                      {getTypeLabel(favorite.type)}
                      {favorite.description && ` • ${favorite.description}`}
                      {favorite.rating && (
                        <span className="ml-2 flex items-center">
                          {renderStars(favorite.rating)}
                        </span>
                      )}
                    </p>
                    {favorite.notes && (
                      <p className="text-xs text-gray-400 mt-1">{favorite.notes}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(favorite)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this favorite?')) {
                        handleDelete(favorite.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FavoritesList; 
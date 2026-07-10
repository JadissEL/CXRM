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
  CreditCard, 
  Plus, 
  Edit, 
  Trash2, 
  Loader2 
} from 'lucide-react';
import { profileAPI } from '../../../shared/api';
import type { PaymentMethod } from '../../../shared/schemas';

const paymentMethodSchema = z.object({
  type: z.enum(['credit_card', 'debit_card', 'paypal']),
  card_number: z.string().min(1, 'Card number is required'),
  card_holder: z.string().min(1, 'Card holder name is required'),
  expiry_month: z.string().min(1, 'Expiry month is required'),
  expiry_year: z.string().min(1, 'Expiry year is required'),
  cvv: z.string().min(3, 'CVV is required').max(4, 'CVV must be 3-4 digits'),
  is_default: z.boolean().default(false)
});

type PaymentMethodFormData = z.infer<typeof paymentMethodSchema>;

const PaymentMethodForm: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<PaymentMethod | null>(null);
  const queryClient = useQueryClient();

  const { data: paymentMethods = [], isLoading } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: profileAPI.getPaymentMethods
  });

  const createMutation = useMutation({
    mutationFn: (data: PaymentMethodFormData) => profileAPI.createPaymentMethod(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
      toast.success('Payment method added successfully');
      setIsDialogOpen(false);
      reset();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add payment method');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: PaymentMethodFormData }) =>
      profileAPI.updatePaymentMethod(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
      toast.success('Payment method updated successfully');
      setIsDialogOpen(false);
      setEditingPaymentMethod(null);
      reset();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update payment method');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => profileAPI.deletePaymentMethod(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
      toast.success('Payment method deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete payment method');
    }
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<PaymentMethodFormData>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: {
      type: 'credit_card',
      card_number: '',
      card_holder: '',
      expiry_month: '',
      expiry_year: '',
      cvv: '',
      is_default: false
    }
  });

  const onSubmit = (data: PaymentMethodFormData) => {
    if (editingPaymentMethod) {
      updateMutation.mutate({ id: editingPaymentMethod.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (paymentMethod: PaymentMethod) => {
    setEditingPaymentMethod(paymentMethod);
    reset({
      type: paymentMethod.type,
      card_number: paymentMethod.card_number,
      card_holder: paymentMethod.card_holder,
      expiry_month: paymentMethod.expiry_month,
      expiry_year: paymentMethod.expiry_year,
      cvv: '',
      is_default: paymentMethod.is_default
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    setEditingPaymentMethod(null);
    reset();
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const maskCardNumber = (cardNumber: string) => {
    const parts = cardNumber.split(' ');
    if (parts.length >= 4) {
      return `${parts[0]} **** **** ${parts[parts.length - 1]}`;
    }
    return cardNumber;
  };

  const getCardTypeIcon = (type: string) => {
    switch (type) {
      case 'credit_card':
        return <CreditCard className="h-4 w-4" />;
      case 'debit_card':
        return <CreditCard className="h-4 w-4" />;
      case 'paypal':
        return <span className="text-blue-600 font-bold text-sm">PayPal</span>;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Methods
          </CardTitle>
          <CardDescription>
            Manage your payment methods for quick checkout
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
              <CreditCard className="h-5 w-5" />
              Payment Methods
            </CardTitle>
            <CardDescription>
              Manage your payment methods for quick checkout
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Payment Method
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingPaymentMethod ? 'Edit Payment Method' : 'Add Payment Method'}
                </DialogTitle>
                <DialogDescription>
                  {editingPaymentMethod 
                    ? 'Update your payment method details below.'
                    : 'Add a new payment method for quick checkout.'
                  }
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Payment Type</Label>
                    <Controller
                      name="type"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="credit_card">Credit Card</SelectItem>
                            <SelectItem value="debit_card">Debit Card</SelectItem>
                            <SelectItem value="paypal">PayPal</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.type && (
                      <p className="text-sm text-red-500">{errors.type.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="card_number">Card Number</Label>
                  <Controller
                    name="card_number"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="1234 5678 9012 3456"
                        onChange={(e) => {
                          const formatted = formatCardNumber(e.target.value);
                          field.onChange(formatted);
                        }}
                      />
                    )}
                  />
                  {errors.card_number && (
                    <p className="text-sm text-red-500">{errors.card_number.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="card_holder">Card Holder Name</Label>
                  <Controller
                    name="card_holder"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="John Doe"
                      />
                    )}
                  />
                  {errors.card_holder && (
                    <p className="text-sm text-red-500">{errors.card_holder.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry_month">Expiry Month</Label>
                    <Controller
                      name="expiry_month"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="MM" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                              <SelectItem key={month} value={month.toString().padStart(2, '0')}>
                                {month.toString().padStart(2, '0')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.expiry_month && (
                      <p className="text-sm text-red-500">{errors.expiry_month.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expiry_year">Expiry Year</Label>
                    <Controller
                      name="expiry_year"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="YYYY" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(year => (
                              <SelectItem key={year} value={year.toString()}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.expiry_year && (
                      <p className="text-sm text-red-500">{errors.expiry_year.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cvv">CVV</Label>
                    <Controller
                      name="cvv"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          placeholder="123"
                          maxLength={4}
                        />
                      )}
                    />
                    {errors.cvv && (
                      <p className="text-sm text-red-500">{errors.cvv.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Controller
                    name="is_default"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="checkbox"
                        id="is_default"
                        checked={field.value}
                        onChange={field.onChange}
                        className="rounded border-gray-300"
                      />
                    )}
                  />
                  <Label htmlFor="is_default" className="text-sm">
                    Set as default payment method
                  </Label>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingPaymentMethod ? 'Update' : 'Add'} Payment Method
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {paymentMethods.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No payment methods</h3>
            <p className="text-gray-500 mb-4">
              Add a payment method to enable quick checkout
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Payment Method
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {paymentMethods.map((paymentMethod) => (
              <div
                key={paymentMethod.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {getCardTypeIcon(paymentMethod.type)}
                  <div>
                    <p className="font-medium">
                      {maskCardNumber(paymentMethod.card_number)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {paymentMethod.card_holder} • Expires {paymentMethod.expiry_month}/{paymentMethod.expiry_year}
                      {paymentMethod.is_default && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Default
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(paymentMethod)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this payment method?')) {
                        handleDelete(paymentMethod.id);
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

export default PaymentMethodForm; 
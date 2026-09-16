'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const productSchema = z.object({
  product: z.string().min(1, 'Product name is required').max(100, 'Product name too long'),
  price: z.coerce.number().min(0, 'Price must be positive'),
  rating: z.coerce.number().min(0, 'Rating must be positive').max(5, 'Rating cannot exceed 5'),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  product?: Product | null;
  products?: Product[];
  onSuccess: () => void;
  onCancel?: () => void;
}

export function ProductForm({ product, products = [], onSuccess, onCancel }: ProductFormProps) {
  const isEditing = !!product;
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      product: '',
      price: 0,
      rating: 0,
    },
  });

  useEffect(() => {
    if (product) {
      reset({
        product: product.product,
        price: product.price,
        rating: product.rating,
      });
    } else {
      reset({
        product: '',
        price: 0,
        rating: 0,
      });
    }
  }, [product, reset]);

  const onSubmit = async (data: ProductFormData) => {
    setServerError(null);
    try {
      if (isEditing && product) {
        await updateProduct(product.id, data);
      } else {
        const nextId = products.length ? Math.max(...products.map((p) => p.id)) + 1 : 1;
        await createProduct({ id: nextId, ...data });
      }
      onSuccess();
    } catch (error: any) {
      setServerError(error.message || 'Failed to save - check Django server at :8000 and DB connection');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {serverError && <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">{serverError}</p>}
      <div className="space-y-2">
        <Label htmlFor="product">Product Name</Label>
        <Input id="product" placeholder="Enter product name" {...register('product')} />
        {errors.product && <p className="text-sm text-destructive">{errors.product.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Price</Label>
          <Input id="price" type="number" step="0.01" min="0" placeholder="0.00" {...register('price')} />
          {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="rating">Rating</Label>
          <Input id="rating" type="number" step="0.1" min="0" max="5" placeholder="0.0" {...register('rating')} />
          {errors.rating && <p className="text-sm text-destructive">{errors.rating.message}</p>}
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4 border-t">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}

function apiBase(): string {
  if (typeof window !== 'undefined') return '/api/backend';
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
}

async function createProduct(data: ProductFormData & { id: number }): Promise<any> {
  const base = apiBase();
  const response = await fetch(`${base}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed' }));
    const msg = typeof error?.message === 'string' ? error.message : JSON.stringify(error?.message || error);
    throw new Error(msg || 'Failed to create product');
  }

  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

async function updateProduct(id: number, data: Partial<ProductFormData>): Promise<any> {
  const base = apiBase();
  const response = await fetch(`${base}/update/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed' }));
    const msg = typeof error?.message === 'string' ? error.message : JSON.stringify(error?.message || error);
    throw new Error(msg || 'Failed to update product');
  }

  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

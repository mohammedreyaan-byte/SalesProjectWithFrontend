'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Product } from '@/types';
import { getProductById } from '@/services/api';
import { ArrowLeft, Package, Star, DollarSign, Calendar, Hash } from 'lucide-react';

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || isNaN(id)) {
      setError('Invalid product ID');
      setLoading(false);
      return;
    }
    getProductById(id)
      .then(setProduct)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6 max-w-4xl">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="grid gap-6 md:grid-cols-2">
            <div className="h-64 bg-muted animate-pulse rounded-lg" />
            <div className="h-64 bg-muted animate-pulse rounded-lg" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !product) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl">
          <Button variant="ghost" onClick={() => router.back()} className="gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">{error || 'Product not found'}</p>
              <Link href="/products">
                <Button variant="outline" className="mt-4">Go to Products</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Package className="h-6 w-6" /> {product.product}
            </h1>
            <p className="text-sm text-muted-foreground font-mono">ID: {product.id}</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
              <CardDescription>Details for {product.product}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Hash className="h-4 w-4" /> Product ID
                </span>
                <span className="font-mono font-medium">{product.id}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Package className="h-4 w-4" /> Product Name
                </span>
                <span className="font-medium">{product.product}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" /> Price
                </span>
                <span className="font-mono font-bold text-lg">{formatCurrency(product.price)}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Star className="h-4 w-4" /> Rating
                </span>
                <span className="font-mono flex items-center gap-1">
                  {product.rating.toFixed(1)} <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
              <CardDescription>Timestamps and system info</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Created At
                </span>
                <p className="font-mono text-sm bg-muted p-2 rounded">{formatDateTime(product.created_at)}</p>
              </div>
              <div className="space-y-2">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Updated At
                </span>
                <p className="font-mono text-sm bg-muted p-2 rounded">{formatDateTime(product.updated_at)}</p>
              </div>
              <Separator />
              <div className="pt-2">
                <p className="text-xs text-muted-foreground">
                  Price per unit: <span className="font-mono font-medium text-foreground">{formatCurrency(product.price)}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Rating: <span className="font-mono font-medium text-foreground">{product.rating.toFixed(1)} / 5.0</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sales Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Revenue Contribution</p>
                <p className="text-xl font-bold font-mono mt-1">{formatCurrency(product.price)}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Rating Score</p>
                <p className="text-xl font-bold font-mono mt-1">{product.rating.toFixed(1)}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Product ID</p>
                <p className="text-xl font-bold font-mono mt-1">#{product.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

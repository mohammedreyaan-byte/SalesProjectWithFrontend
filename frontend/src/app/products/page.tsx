'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useProducts } from '@/hooks/use-products';
import { ProductTable } from '@/components/products/product-table';
import { SkeletonCard } from '@/components/ui/skeleton';

export default function ProductsPage() {
  const { products, loading, error, refetch } = useProducts();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Products</h1>
            <p className="text-muted-foreground mt-1">Manage product catalog.</p>
          </div>
          <SkeletonCard className="h-96" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">Failed to load products</h2>
          <p className="text-muted-foreground mt-2">{error}</p>
          <button onClick={refetch} className="mt-4 text-primary hover:underline">Retry</button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Products</h1>
            <p className="text-muted-foreground mt-1">Manage product catalog — create, view, update, delete.</p>
          </div>
          <span className="text-xs font-mono text-muted-foreground border px-2 py-1 rounded">{products.length} records</span>
        </div>
        <ProductTable products={products} onRefresh={refetch} />
      </div>
    </DashboardLayout>
  );
}

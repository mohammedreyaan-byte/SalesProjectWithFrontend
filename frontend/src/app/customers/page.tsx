'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Users } from 'lucide-react';

export default function CustomersPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground mt-1">Customer management.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={<Users className="h-12 w-12" />}
              title="Customer management coming soon"
              description="Customer data and management features will be implemented here."
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

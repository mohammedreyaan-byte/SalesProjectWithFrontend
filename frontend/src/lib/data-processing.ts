import { Product, KPIData, RevenueDataPoint, ProductPerformanceData, RatingDistribution } from '@/types';
import { subDays, format, eachDayOfInterval, startOfDay, endOfDay } from 'date-fns';

export function calculateKPIs(products: Product[]): KPIData {
  const totalRevenue = products.reduce((sum, p) => sum + p.price, 0);
  const totalSales = products.length;
  const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;
  const productsSold = totalSales;

  return {
    totalRevenue,
    totalSales,
    averageOrderValue,
    productsSold,
  };
}

export function generateRevenueData(products: Product[], days: number): RevenueDataPoint[] {
  const endDate = new Date();
  const startDate = subDays(endDate, days);
  
  const dateMap = new Map<string, { revenue: number; sales: number }>();
  
  products.forEach((product) => {
    const createdAt = new Date(product.created_at);
    if (createdAt >= startDate && createdAt <= endDate) {
      const dateKey = format(createdAt, 'MMM d');
      const existing = dateMap.get(dateKey) || { revenue: 0, sales: 0 };
      existing.revenue += product.price;
      existing.sales += 1;
      dateMap.set(dateKey, existing);
    }
  });

  const allDays = eachDayOfInterval({ start: startOfDay(startDate), end: endOfDay(endDate) });
  
  return allDays.map((day) => {
    const dateKey = format(day, 'MMM d');
    const data = dateMap.get(dateKey) || { revenue: 0, sales: 0 };
    return {
      date: dateKey,
      revenue: data.revenue,
      sales: data.sales,
    };
  });
}

export function calculateProductPerformance(products: Product[]): ProductPerformanceData[] {
  const productMap = new Map<string, { revenue: number; sales: number; ratings: number[]; prices: number[] }>();
  
  products.forEach((product) => {
    const existing = productMap.get(product.product) || { revenue: 0, sales: 0, ratings: [], prices: [] };
    existing.revenue += product.price;
    existing.sales += 1;
    existing.ratings.push(product.rating);
    existing.prices.push(product.price);
    productMap.set(product.product, existing);
  });

  return Array.from(productMap.entries()).map(([product, data]) => ({
    product,
    totalRevenue: data.revenue,
    totalSales: data.sales,
    averageRating: data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length,
    averagePrice: data.prices.reduce((a, b) => a + b, 0) / data.prices.length,
  })).sort((a, b) => b.totalRevenue - a.totalRevenue);
}

export function calculateRatingDistribution(products: Product[]): RatingDistribution[] {
  const distribution = new Map<number, number>();
  
  products.forEach((product) => {
    const roundedRating = Math.round(product.rating * 2) / 2;
    distribution.set(roundedRating, (distribution.get(roundedRating) || 0) + 1);
  });

  return Array.from(distribution.entries())
    .map(([rating, count]) => ({ rating, count }))
    .sort((a, b) => a.rating - b.rating);
}

export function getTopProducts(products: Product[], limit: number = 5): ProductPerformanceData[] {
  return calculateProductPerformance(products).slice(0, limit);
}

export function filterProductsByDateRange(products: Product[], from?: Date, to?: Date): Product[] {
  if (!from && !to) return products;
  
  return products.filter((product) => {
    const createdAt = new Date(product.created_at);
    if (from && createdAt < startOfDay(from)) return false;
    if (to && createdAt > endOfDay(to)) return false;
    return true;
  });
}
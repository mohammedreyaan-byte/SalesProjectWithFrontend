export interface Product {
  id: number;
  product: string;
  price: number;
  rating: number;
  created_at: string;
  updated_at: string;
}

export interface ProductsResponse {
  data: Product[];
}

export interface ApiResponse<T> {
  status: 'success' | 'fail';
  message: string;
  data?: T;
}

export interface KPIData {
  totalRevenue: number;
  totalSales: number;
  averageOrderValue: number;
  productsSold: number;
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
  sales: number;
}

export interface ProductPerformanceData {
  product: string;
  totalRevenue: number;
  totalSales: number;
  averageRating: number;
  averagePrice: number;
}

export interface RatingDistribution {
  rating: number;
  count: number;
}

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}
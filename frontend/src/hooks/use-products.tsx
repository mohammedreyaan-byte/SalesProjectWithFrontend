'use client';

import { useState, useEffect, useCallback } from 'react';
import { Product } from '@/types';
import { getAllProducts, getProductById } from '@/services/api';
import { calculateKPIs, generateRevenueData, calculateProductPerformance, calculateRatingDistribution, getTopProducts, filterProductsByDateRange } from '@/lib/data-processing';
import { KPIData, RevenueDataPoint, ProductPerformanceData, RatingDistribution, DateRange } from '@/types';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllProducts();
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, loading, error, refetch: fetchProducts };
}

export function useDashboardData(dateRange: DateRange) {
  const { products, loading, error, refetch } = useProducts();
  const [kpis, setKpis] = useState<KPIData | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([]);
  const [productPerformance, setProductPerformance] = useState<ProductPerformanceData[]>([]);
  const [ratingDistribution, setRatingDistribution] = useState<RatingDistribution[]>([]);
  const [topProducts, setTopProducts] = useState<ProductPerformanceData[]>([]);

  useEffect(() => {
    if (products.length > 0) {
      const filtered = filterProductsByDateRange(products, dateRange.from, dateRange.to);
      setKpis(calculateKPIs(filtered));
      setRevenueData(generateRevenueData(filtered, 30));
      setProductPerformance(calculateProductPerformance(filtered));
      setRatingDistribution(calculateRatingDistribution(filtered));
      setTopProducts(getTopProducts(filtered, 5));
    } else {
      setKpis(null);
      setRevenueData([]);
      setProductPerformance([]);
      setRatingDistribution([]);
      setTopProducts([]);
    }
  }, [products, dateRange.from, dateRange.to]);

  return {
    products,
    loading,
    error,
    kpis,
    revenueData,
    productPerformance,
    ratingDistribution,
    topProducts,
    refetch,
  };
}

export function useProduct(id: number) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getProductById(id);
        setProduct(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  return { product, loading, error };
}

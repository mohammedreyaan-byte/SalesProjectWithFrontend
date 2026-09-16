import { Product, ApiResponse } from '@/types';

/**
 * Frontend API layer - uses REAL backend endpoints.
 * Backend is read-only and lives at NEXT_PUBLIC_API_URL (default http://localhost:8000).
 * Client-side requests go through Next.js rewrite: /api/backend/:path* -> http://localhost:8000/api/:path*
 * Server-side (SSR) requests hit the backend directly at ${API_URL}/api/:path*.
 */

function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return '/api/backend';
  }
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  return `${base.replace(/\/$/, '')}/api`;
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const base = getBaseUrl();
  const url = `${base}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    const msg = typeof error?.message === 'string' ? error.message : JSON.stringify(error?.message || error);
    throw new Error(msg || `HTTP error! status: ${response.status}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) as T : ({} as T);
}

// Real endpoints discovered in backend/refinement/urls.py
//   POST   /api/               -> add_data        (supports single or list, requires id,product,price,rating)
//   GET    /api/get-data       -> get_data
//   GET    /api/get-data/<id>  -> get_data_by_id
//   PUT    /api/update         -> update_data_by_id (bulk)
//   PUT    /api/update/<id>    -> update_data_by_id (single)
//   DELETE /api/delete/<id>    -> delete_data_by_id
export const productApi = {
  getAll: () => fetchApi<Product[]>('/get-data'),
  
  getById: (id: number) => fetchApi<Product>(`/get-data/${id}`),
  
  create: (data: Omit<Product, 'id' | 'created_at' | 'updated_at'> | Omit<Product, 'id' | 'created_at' | 'updated_at'>[]) => 
    fetchApi<ApiResponse<Product>>('', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: number, data: Partial<Product>) => 
    fetchApi<ApiResponse<Product>>(`/update/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  bulkUpdate: (data: (Partial<Product> & { id: number })[]) => 
    fetchApi<ApiResponse<Product>>('/update', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id: number) => 
    fetchApi<ApiResponse<void>>(`/delete/${id}`, {
      method: 'DELETE',
    }),
};

export async function getAllProducts(): Promise<Product[]> {
  return productApi.getAll();
}

export async function getProductById(id: number): Promise<Product> {
  return productApi.getById(id);
}

export async function createProduct(data: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Product>> {
  return productApi.create(data);
}

export async function updateProduct(id: number, data: Partial<Product>): Promise<ApiResponse<Product>> {
  return productApi.update(id, data);
}

export async function deleteProduct(id: number): Promise<ApiResponse<void>> {
  return productApi.delete(id);
}

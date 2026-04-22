export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  created_at: string;
}

export type CreateProductInput = Omit<Product, 'id' | 'created_at'>;
export type UpdateProductInput = Partial<CreateProductInput>;

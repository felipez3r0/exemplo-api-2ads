import { productRepository } from '../repositories/product.repository';
import {
  CreateProductInput,
  UpdateProductInput,
} from '../models/product.model';
import { AppError } from '../errors/app-error';

export const productService = {
  list() {
    return productRepository.findAll();
  },

  async getById(id: number) {
    const product = await productRepository.findById(id);
    if (!product) throw new AppError('Produto não encontrado', 404);
    return product;
  },

  create(input: CreateProductInput) {
    return productRepository.create(input);
  },

  async update(id: number, input: UpdateProductInput) {
    await this.getById(id); // garante que existe (ou lança 404)
    return productRepository.update(id, input);
  },

  async remove(id: number) {
    await this.getById(id);
    // RN07: não pode remover produto que já está em pedido
    if (await productRepository.existsInOrder(id)) {
      throw new AppError(
        'Produto não pode ser removido: há pedidos associados',
        409,
      );
    }
    await productRepository.delete(id);
  },
};

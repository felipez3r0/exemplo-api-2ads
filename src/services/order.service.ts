import { orderRepository } from '../repositories/order.repository';
import { productRepository } from '../repositories/product.repository';
import { customerRepository } from '../repositories/customer.repository';
import { CreateOrderInput } from '../models/order.model';
import { AppError } from '../errors/app-error';

export const orderService = {
  async create(input: CreateOrderInput) {
    const customer = await customerRepository.findById(input.customer_id);
    if (!customer) throw new AppError('Cliente não encontrado', 404);

    const prepared: Array<{
      product_id: number;
      quantity: number;
      unit_price: number;
    }> = [];
    let total = 0;

    for (const item of input.items) {
      const product = await productRepository.findById(item.product_id);
      if (!product)
        throw new AppError(`Produto ${item.product_id} não encontrado`, 404);

      prepared.push({
        product_id: product.id,
        quantity: item.quantity,
        unit_price: product.price, // RN05: fotografia do preço no momento da venda
      });
      total += product.price * item.quantity;
    }

    const orderId = await orderRepository.createOrder(input.customer_id, total);
    for (const it of prepared) {
      await orderRepository.addItem(
        orderId,
        it.product_id,
        it.quantity,
        it.unit_price,
      );
    }
    return orderRepository.findById(orderId);
  },

  async getById(id: number) {
    const order = await orderRepository.findById(id);
    if (!order) throw new AppError('Pedido não encontrado', 404);
    return order;
  },

  list() {
    return orderRepository.findAll();
  },

  async listByCustomer(customerId: number) {
    const customer = await customerRepository.findById(customerId);
    if (!customer) throw new AppError('Cliente não encontrado', 404);
    return orderRepository.findByCustomerId(customerId);
  },
};

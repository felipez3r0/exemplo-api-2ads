import { Request, Response, NextFunction } from 'express';
import { orderService } from '../services/order.service';
import { createOrderSchema } from '../schemas/order.schema';

export const orderController = {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await orderService.list());
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await orderService.getById(Number(req.params.id)));
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createOrderSchema.parse(req.body);
      res.status(201).json(await orderService.create(data));
    } catch (err) {
      next(err);
    }
  },

  async listByCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await orderService.listByCustomer(Number(req.params.id)));
    } catch (err) {
      next(err);
    }
  },
};

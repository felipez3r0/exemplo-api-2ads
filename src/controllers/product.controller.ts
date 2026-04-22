import { Request, Response, NextFunction } from 'express';
import { productService } from '../services/product.service';
import {
  createProductSchema,
  updateProductSchema,
} from '../schemas/product.schema';

export const productController = {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await productService.list());
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await productService.getById(Number(req.params.id)));
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createProductSchema.parse(req.body);
      const data = { ...parsed, description: parsed.description ?? null };
      res.status(201).json(await productService.create(data));
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateProductSchema.parse(req.body);
      res.json(await productService.update(Number(req.params.id), data));
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await productService.remove(Number(req.params.id));
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
};

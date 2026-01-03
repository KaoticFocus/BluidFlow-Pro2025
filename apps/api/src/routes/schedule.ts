import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PlanFilterSchema, PlanCreateSchema } from '../schemas/schedule';

const router = Router();

router.get('/schedule/plans', async (req: Request, res: Response) => {
  const parse = PlanFilterSchema.safeParse(req.query);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });

  // TODO: implement DB query using filters
  const { status, range, page = 1, pageSize = 20 } = parse.data;
  return res.json({
    items: [],
    page,
    pageSize,
    total: 0,
    filters: { status, range },
  });
});

router.post('/schedule/plans', async (req: Request, res: Response) => {
  const parse = PlanCreateSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });

  // TODO: persist plan
  const plan = { id: 'plan_stub', ...parse.data };
  return res.status(201).json({ plan });
});

export default router;

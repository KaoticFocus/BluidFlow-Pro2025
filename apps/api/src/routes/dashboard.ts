import { Router, Request, Response } from 'express';

const router = Router();

router.get('/dashboard/summary', async (_req: Request, res: Response) => {
  // TODO: fetch real metrics from DB/services
  return res.json({
    tasksOverdue: 0,
    tasksDueToday: 0,
    latestPlansApproved: 0,
  });
});

export default router;

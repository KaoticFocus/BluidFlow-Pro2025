import { Hono } from "hono";
import type { Context } from "hono";
import { zValidator } from "@hono/zod-validator";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { authMiddleware, tenantMiddleware, requirePermission } from "../middleware/auth";
import type { AuthContext } from "../middleware/auth";
import { idempotencyMiddleware } from "../middleware/idempotency";
import { PERMISSIONS } from "../../../../packages/shared/src/rbac";
import { prisma } from "../lib/prisma";
import { createOutboxEvent } from "../lib/outbox";

const taskflowRoutes = new Hono();

// All routes require authentication and tenant context
taskflowRoutes.use("*", authMiddleware, tenantMiddleware);

// Apply idempotency middleware to mutation endpoints
taskflowRoutes.use("*", idempotencyMiddleware);

// ============================================================================
// UPLOADS
// ============================================================================

const UploadPresignBodySchema = z.object({
  type: z.enum(["audio", "image"]),
  mime_type: z.string().min(1),
  size_bytes: z.number().int().positive(),
});

taskflowRoutes.post("/uploads/presign", zValidator("json", UploadPresignBodySchema), async (c: Context) => {
  const authCtx = c.get("auth") as AuthContext;
  const tenantId = authCtx.tenantId!;
  const input = c.req.valid("json") as z.infer<typeof UploadPresignBodySchema>;

  // TODO: Issue a real presigned URL (R2/S3)
  // For now return stub fields
  const attachmentId = crypto.randomUUID();
  
  return c.json({
    upload_url: `https://storage.example.com/presign/${attachmentId}`,
    attachment_id: attachmentId,
    expires_at: new Date(Date.now() + 5 * 60_000).toISOString(),
  });
});

// ============================================================================
// TASKS
// ============================================================================

const CreateTaskBodySchema = z.object({
  project_id: z.string().uuid().optional(),
  source: z.enum(["text", "voice", "photo", "manual"]),
  title: z.string().max(140).optional(),
  description: z.string().max(5000).optional(),
  attachment_id: z.string().uuid().optional(),
  checklist: z.array(z.object({
    title: z.string().max(140),
    due_date: z.string().optional(),
    assignee_id: z.string().uuid().optional(),
  })).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  type: z.enum(["general", "punch"]).optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  due_date: z.string().optional(),
  assignee_id: z.string().uuid().optional(),
  consent: z.boolean().optional(),
});

taskflowRoutes.post("/tasks", zValidator("json", CreateTaskBodySchema), async (c: Context) => {
  const authCtx = c.get("auth") as AuthContext;
  const tenantId = authCtx.tenantId!;
  const input = c.req.valid("json") as z.infer<typeof CreateTaskBodySchema>;

  const isAiSource = input.source === "voice" || input.source === "photo";
  const status = isAiSource ? "pending_approval" : "open";

  const task = await prisma.$transaction(async (tx) => {
    const newTask = await tx.task.create({
      data: {
        tenantId,
        projectId: input.project_id || null,
        source: input.source,
        type: input.type || "general",
        status,
        title: input.title || "(untitled)",
        description: input.description || "",
        priority: input.priority || "normal",
        dueDate: input.due_date ? new Date(input.due_date) : null,
        assignedToId: input.assignee_id || null,
        aiGenerated: isAiSource,
        createdById: authCtx.user.id,
      },
    });

    // Emit event
    await tx.outboxEvent.create({
      data: createOutboxEvent({
        tenantId,
        eventType: "task.created.v1",
        aggregateId: newTask.id,
        actorUserId: authCtx.user.id,
        payload: {
          taskId: newTask.id,
          source: input.source,
          status,
          aiGenerated: isAiSource,
        },
      }),
    });

    return newTask;
  });

  return c.json({
    task: {
      id: task.id,
      tenant_id: task.tenantId,
      project_id: task.projectId,
      source: task.source,
      type: task.type,
      status: task.status,
      title: task.title,
      description: task.description,
      priority: task.priority,
      due_date: task.dueDate?.toISOString() || null,
      assignee_id: task.assignedToId,
      ai_generated: task.aiGenerated,
      created_at: task.createdAt.toISOString(),
      updated_at: task.updatedAt.toISOString(),
    },
    ai_job_id: isAiSource ? crypto.randomUUID() : null,
  }, 201);
});

taskflowRoutes.get("/tasks", async (c: Context) => {
  const authCtx = c.get("auth") as AuthContext;
  const tenantId = authCtx.tenantId!;

  // Parse query params
  const status = c.req.query("status");
  const projectId = c.req.query("project_id");
  const source = c.req.query("source");
  const type = c.req.query("type");
  const priority = c.req.query("priority");
  const assigneeId = c.req.query("assignee_id");

  const where: any = { tenantId };
  if (status) where.status = status;
  if (projectId) where.projectId = projectId;
  if (source) where.source = source;
  if (type) where.type = type;
  if (priority) where.priority = priority;
  if (assigneeId) where.assignedToId = assigneeId;

  const tasks = await prisma.task.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: 100, // Limit for MVP
  });

  return c.json({
    tasks: tasks.map((task: any) => ({
      id: task.id,
      tenant_id: task.tenantId,
      project_id: task.projectId,
      source: task.source,
      type: task.type,
      status: task.status,
      title: task.title,
      description: task.description,
      priority: task.priority,
      due_date: task.dueDate?.toISOString() || null,
      assignee_id: task.assignedToId,
      ai_generated: task.aiGenerated,
      created_at: task.createdAt.toISOString(),
      updated_at: task.updatedAt.toISOString(),
    })),
  });
});

taskflowRoutes.get("/tasks/:id", async (c: Context) => {
  const authCtx = c.get("auth") as AuthContext;
  const tenantId = authCtx.tenantId!;
  const taskId = c.req.param("id");

  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      tenantId,
    },
  });

  if (!task) {
    throw new HTTPException(404, { message: "Task not found" });
  }

  return c.json({
    task: {
      id: task.id,
      tenant_id: task.tenantId,
      project_id: task.projectId,
      source: task.source,
      type: task.type,
      status: task.status,
      title: task.title,
      description: task.description,
      priority: task.priority,
      due_date: task.dueDate?.toISOString() || null,
      assignee_id: task.assignedToId,
      ai_generated: task.aiGenerated,
      created_at: task.createdAt.toISOString(),
      updated_at: task.updatedAt.toISOString(),
    },
  });
});

const UpdateTaskBodySchema = z.object({
  title: z.string().max(140).optional(),
  description: z.string().max(5000).optional(),
  status: z.enum(["open", "in_progress", "completed", "cancelled"]).optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  due_date: z.string().optional(),
  assignee_id: z.string().uuid().optional(),
});

taskflowRoutes.patch("/tasks/:id", zValidator("json", UpdateTaskBodySchema), async (c: Context) => {
  const authCtx = c.get("auth") as AuthContext;
  const tenantId = authCtx.tenantId!;
  const taskId = c.req.param("id");
  const input = c.req.valid("json") as z.infer<typeof UpdateTaskBodySchema>;

  // Get existing task
  const existingTask = await prisma.task.findFirst({
    where: {
      id: taskId,
      tenantId,
    },
  });

  if (!existingTask) {
    throw new HTTPException(404, { message: "Task not found" });
  }

  // Validate status transitions
  if (input.status && input.status !== existingTask.status) {
    const validTransitions: Record<string, string[]> = {
      pending_approval: ["approved", "open"],
      approved: ["open"],
      open: ["in_progress", "completed", "cancelled"],
      in_progress: ["completed", "cancelled"],
    };

    const allowed = validTransitions[existingTask.status] || [];
    if (!allowed.includes(input.status)) {
      throw new HTTPException(400, {
        message: `Invalid status transition from ${existingTask.status} to ${input.status}`,
      });
    }
  }

  const updateData: any = {};
  if (input.title !== undefined) updateData.title = input.title;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.status !== undefined) updateData.status = input.status;
  if (input.priority !== undefined) updateData.priority = input.priority;
  if (input.due_date !== undefined) updateData.dueDate = input.due_date ? new Date(input.due_date) : null;
  if (input.assignee_id !== undefined) updateData.assignedToId = input.assignee_id;

  const task = await prisma.$transaction(async (tx) => {
    const updatedTask = await tx.task.update({
      where: { id: taskId },
      data: updateData,
    });

    // Emit event
    await tx.outboxEvent.create({
      data: createOutboxEvent({
        tenantId,
        eventType: "task.updated.v1",
        aggregateId: updatedTask.id,
        actorUserId: authCtx.user.id,
        payload: {
          taskId: updatedTask.id,
          changes: input,
        },
      }),
    });

    return updatedTask;
  });

  return c.json({
    task: {
      id: task.id,
      tenant_id: task.tenantId,
      project_id: task.projectId,
      source: task.source,
      type: task.type,
      status: task.status,
      title: task.title,
      description: task.description,
      priority: task.priority,
      due_date: task.dueDate?.toISOString() || null,
      assignee_id: task.assignedToId,
      ai_generated: task.aiGenerated,
      created_at: task.createdAt.toISOString(),
      updated_at: task.updatedAt.toISOString(),
    },
  });
});

const ApproveTaskBodySchema = z.object({
  note: z.string().max(2000).optional(),
});

taskflowRoutes.post(
  "/tasks/:id/approve",
  requirePermission(PERMISSIONS.TASKS_APPROVE),
  zValidator("json", ApproveTaskBodySchema),
  async (c: Context) => {
    const authCtx = c.get("auth") as AuthContext;
    const tenantId = authCtx.tenantId!;
    const taskId = c.req.param("id");
    const input = c.req.valid("json") as z.infer<typeof ApproveTaskBodySchema>;

    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        tenantId,
      },
    });

    if (!task) {
      throw new HTTPException(404, { message: "Task not found" });
    }

    if (task.status !== "pending_approval") {
      throw new HTTPException(400, { message: "Task is not pending approval" });
    }

    const updatedTask = await prisma.$transaction(async (tx) => {
      const approved = await tx.task.update({
        where: { id: taskId },
        data: {
          status: "open", // Move to open after approval
        },
      });

      // Emit event
      await tx.outboxEvent.create({
        data: createOutboxEvent({
          tenantId,
          eventType: "task.approved.v1",
          aggregateId: approved.id,
          actorUserId: authCtx.user.id,
          payload: {
            taskId: approved.id,
            note: input.note,
          },
        }),
      });

      return approved;
    });

    return c.json({
      status: "approved",
      task: {
        id: updatedTask.id,
        status: updatedTask.status,
      },
    });
  }
);

// ============================================================================
// DAILY PLANS
// ============================================================================

const GenerateDailyPlanSchema = z.object({
  project_id: z.string().uuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  constraints: z.record(z.any()).optional(),
});

taskflowRoutes.post("/daily-plans/generate", zValidator("json", GenerateDailyPlanSchema), async (c: Context) => {
  const authCtx = c.get("auth") as AuthContext;
  const tenantId = authCtx.tenantId!;
  const input = c.req.valid("json") as z.infer<typeof GenerateDailyPlanSchema>;

  const planDate = new Date(input.date);
  const planDateStr = input.date; // YYYY-MM-DD format

  // Query tasks for daily plan generation
  // 1. Tasks in TODO/IN_PROGRESS status due on/before the plan date
  // 2. Recent approved AI-generated tasks
  // 3. Backlog items (no due date, open status)
  const where: any = {
    tenantId,
    type: { not: "checklist_item" }, // Exclude checklist items
  };

  if (input.project_id) {
    where.projectId = input.project_id;
  }

  // Get tasks that should be included
  const candidateTasks = await prisma.task.findMany({
    where: {
      ...where,
      OR: [
        // Tasks due on or before plan date
        {
          status: { in: ["open", "in_progress"] },
          dueDate: { lte: planDate },
        },
        // Recent approved AI tasks (last 7 days)
        {
          status: "open",
          aiGenerated: true,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
        // Backlog items (no due date, open)
        {
          status: "open",
          dueDate: null,
        },
      ],
    },
    orderBy: [
      { priority: "desc" }, // High priority first
      { dueDate: "asc" }, // Due date ascending
      { createdAt: "desc" }, // Recent first
    ],
    take: 16, // Cap at 16 items
  });

  const taskIds = candidateTasks.map((task) => task.id);

  // Calculate metrics
  const metrics = {
    total: candidateTasks.length,
    pinned: 0, // TODO: Add pinned field to Task model if needed
    dueToday: candidateTasks.filter((t) => {
      if (!t.dueDate) return false;
      const dueDateStr = t.dueDate.toISOString().split("T")[0];
      return dueDateStr === planDateStr;
    }).length,
    overdue: candidateTasks.filter((t) => {
      if (!t.dueDate) return false;
      return t.dueDate < planDate && t.status !== "completed";
    }).length,
  };

  const dailyPlan = await prisma.$transaction(async (tx) => {
    const plan = await tx.dailyPlan.create({
      data: {
        tenantId,
        projectId: input.project_id || null,
        date: planDateStr,
        status: "pending_approval",
        taskIds,
        summary: `Daily plan for ${planDateStr} with ${taskIds.length} tasks`,
        aiGenerated: true,
        createdById: authCtx.user.id,
      },
    });

    // Emit event
    await tx.outboxEvent.create({
      data: createOutboxEvent({
        tenantId,
        eventType: "daily_plan.generated.v1",
        aggregateId: plan.id,
        actorUserId: authCtx.user.id,
        payload: {
          dailyPlanId: plan.id,
          date: planDateStr,
          taskIds,
          metrics,
        },
      }),
    });

    return plan;
  });

  return c.json(
    {
      daily_plan_id: dailyPlan.id,
      metrics,
      ai_job_id: crypto.randomUUID(),
    },
    202
  );
});

taskflowRoutes.get("/daily-plans/:id", async (c: Context) => {
  const authCtx = c.get("auth") as AuthContext;
  const tenantId = authCtx.tenantId!;
  const planId = c.req.param("id");

  const plan = await prisma.dailyPlan.findFirst({
    where: {
      id: planId,
      tenantId,
    },
  });

  if (!plan) {
    throw new HTTPException(404, { message: "Daily plan not found" });
  }

  return c.json({
    daily_plan: {
      id: plan.id,
      tenant_id: plan.tenantId,
      project_id: plan.projectId,
      date: plan.date,
      status: plan.status,
      task_ids: plan.taskIds,
      summary: plan.summary,
      ai_generated: plan.aiGenerated,
      approved_by_id: plan.approvedById,
      approved_at: plan.approvedAt?.toISOString() || null,
      created_at: plan.createdAt.toISOString(),
      updated_at: plan.updatedAt.toISOString(),
    },
  });
});

/**
 * POST /taskflow/daily-plans/:id/approve
 * Approve a daily plan
 */
const ApproveDailyPlanSchema = z.object({
  note: z.string().max(2000).optional(),
});

taskflowRoutes.post(
  "/daily-plans/:id/approve",
  requirePermission(PERMISSIONS.TASKS_APPROVE),
  zValidator("json", ApproveDailyPlanSchema),
  async (c: Context) => {
    const authCtx = c.get("auth") as AuthContext;
    const tenantId = authCtx.tenantId!;
    const planId = c.req.param("id");
    const input = c.req.valid("json") as z.infer<typeof ApproveDailyPlanSchema>;

    const plan = await prisma.dailyPlan.findFirst({
      where: {
        id: planId,
        tenantId,
      },
    });

    if (!plan) {
      throw new HTTPException(404, { message: "Daily plan not found" });
    }

    if (plan.status !== "pending_approval") {
      throw new HTTPException(400, {
        message: `Daily plan is not pending approval. Current status: ${plan.status}`,
      });
    }

    const updatedPlan = await prisma.$transaction(async (tx) => {
      const approved = await tx.dailyPlan.update({
        where: { id: planId },
        data: {
          status: "approved",
          approvedById: authCtx.user.id,
          approvedAt: new Date(),
        },
      });

      // Emit event
      await tx.outboxEvent.create({
        data: createOutboxEvent({
          tenantId,
          eventType: "daily_plan.approved.v1",
          aggregateId: approved.id,
          actorUserId: authCtx.user.id,
          payload: {
            dailyPlanId: approved.id,
            date: approved.date,
            taskIds: approved.taskIds,
            note: input.note || null,
          },
        }),
      });

      return approved;
    });

    return c.json({
      status: "approved",
      daily_plan: {
        id: updatedPlan.id,
        status: updatedPlan.status,
        approved_at: updatedPlan.approvedAt?.toISOString(),
      },
    });
  }
);

// ============================================================================
// CHECKLIST OPERATIONS
// ============================================================================

const CreateChecklistItemSchema = z.object({
  title: z.string().min(1).max(140),
  due_date: z.string().optional(),
  assignee_id: z.string().uuid().optional(),
});

const UpdateChecklistItemSchema = z.object({
  title: z.string().min(1).max(140).optional(),
  status: z.enum(["open", "in_progress", "completed", "cancelled"]).optional(),
  due_date: z.string().optional(),
  assignee_id: z.string().uuid().optional(),
});

/**
 * POST /taskflow/tasks/:id/checklist
 * Create a checklist item for a task
 */
taskflowRoutes.post(
  "/tasks/:id/checklist",
  zValidator("json", CreateChecklistItemSchema),
  async (c: Context) => {
    const authCtx = c.get("auth") as AuthContext;
    const tenantId = authCtx.tenantId!;
    const taskId = c.req.param("id");
    const input = c.req.valid("json") as z.infer<typeof CreateChecklistItemSchema>;

    // Verify parent task exists and user has access
    const parentTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        tenantId,
      },
    });

    if (!parentTask) {
      throw new HTTPException(404, { message: "Task not found" });
    }

    const checklistItem = await prisma.$transaction(async (tx) => {
      // Create checklist item as a task with type="checklist_item"
      const item = await tx.task.create({
        data: {
          tenantId,
          parentTaskId: taskId,
          projectId: parentTask.projectId,
          source: "manual",
          type: "checklist_item",
          status: "open",
          title: input.title,
          priority: parentTask.priority,
          dueDate: input.due_date ? new Date(input.due_date) : null,
          assignedToId: input.assignee_id || null,
          createdById: authCtx.user.id,
        } as any,
      });

      // Emit event
      await tx.outboxEvent.create({
        data: createOutboxEvent({
          tenantId,
          eventType: "task.checklist_item.created.v1",
          aggregateId: item.id,
          actorUserId: authCtx.user.id,
          payload: {
            taskId,
            checklistItemId: item.id,
            title: input.title,
          },
        }),
      });

      return item;
    });

    return c.json({
      checklist_item: {
        id: checklistItem.id,
        task_id: taskId,
        title: checklistItem.title,
        status: checklistItem.status,
        due_date: checklistItem.dueDate?.toISOString() || null,
        assignee_id: checklistItem.assignedToId,
        created_at: checklistItem.createdAt.toISOString(),
      },
    }, 201);
  }
);

/**
 * PATCH /taskflow/tasks/:id/checklist/:itemId
 * Update a checklist item
 */
taskflowRoutes.patch(
  "/tasks/:id/checklist/:itemId",
  zValidator("json", UpdateChecklistItemSchema),
  async (c: Context) => {
    const authCtx = c.get("auth") as AuthContext;
    const tenantId = authCtx.tenantId!;
    const taskId = c.req.param("id");
    const itemId = c.req.param("itemId");
    const input = c.req.valid("json") as z.infer<typeof UpdateChecklistItemSchema>;

    // Verify parent task exists
    const parentTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        tenantId,
      },
    });

    if (!parentTask) {
      throw new HTTPException(404, { message: "Task not found" });
    }

    // Verify checklist item exists and belongs to task
    const checklistItem = await prisma.task.findFirst({
      where: {
        id: itemId,
        tenantId,
        parentTaskId: taskId,
        type: "checklist_item",
      } as any,
    });

    if (!checklistItem) {
      throw new HTTPException(404, { message: "Checklist item not found" });
    }

    const updateData: any = {};
    if (input.title !== undefined) updateData.title = input.title;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.due_date !== undefined) updateData.dueDate = input.due_date ? new Date(input.due_date) : null;
    if (input.assignee_id !== undefined) updateData.assignedToId = input.assignee_id;

    const result = await prisma.$transaction(async (tx) => {
      const updatedItem = await tx.task.update({
        where: { id: itemId },
        data: updateData,
      });

      // Check if all checklist items are completed
      if (input.status === "completed") {
        const allItems = await tx.task.findMany({
          where: {
            parentTaskId: taskId,
            tenantId,
            type: "checklist_item",
          } as any,
        });

        const allCompleted = allItems.every((item) => item.status === "completed");
        
        if (allCompleted && parentTask.status !== "completed") {
          // Auto-complete parent task
          await tx.task.update({
            where: { id: taskId },
            data: { status: "completed" },
          });

          // Emit task completion event
          await tx.outboxEvent.create({
            data: createOutboxEvent({
              tenantId,
              eventType: "task.completed.v1",
              aggregateId: taskId,
              actorUserId: authCtx.user.id,
              payload: {
                taskId,
                autoCompleted: true,
                reason: "All checklist items completed",
              },
            }),
          });
        }
      }

      // Emit checklist item update event
      await tx.outboxEvent.create({
        data: createOutboxEvent({
          tenantId,
          eventType: "task.checklist_item.updated.v1",
          aggregateId: itemId,
          actorUserId: authCtx.user.id,
          payload: {
            taskId,
            checklistItemId: itemId,
            changes: input,
          },
        }),
      });

      return updatedItem;
    });

    return c.json({
      checklist_item: {
        id: result.id,
        task_id: taskId,
        title: result.title,
        status: result.status,
        due_date: result.dueDate?.toISOString() || null,
        assignee_id: result.assignedToId,
        updated_at: result.updatedAt.toISOString(),
      },
    });
  }
);

/**
 * GET /taskflow/tasks/:id/checklist
 * Get all checklist items for a task
 */
taskflowRoutes.get("/tasks/:id/checklist", async (c: Context) => {
  const authCtx = c.get("auth") as AuthContext;
  const tenantId = authCtx.tenantId!;
  const taskId = c.req.param("id");

  // Verify parent task exists
  const parentTask = await prisma.task.findFirst({
    where: {
      id: taskId,
      tenantId,
    },
  });

  if (!parentTask) {
    throw new HTTPException(404, { message: "Task not found" });
  }

  const checklistItems = await prisma.task.findMany({
    where: {
      parentTaskId: taskId,
      tenantId,
      type: "checklist_item",
    } as any,
    orderBy: { createdAt: "asc" },
  });

  return c.json({
    checklist_items: checklistItems.map((item) => ({
      id: item.id,
      task_id: taskId,
      title: item.title,
      status: item.status,
      due_date: item.dueDate?.toISOString() || null,
      assignee_id: item.assignedToId,
      created_at: item.createdAt.toISOString(),
      updated_at: item.updatedAt.toISOString(),
    })),
  });
});

export { taskflowRoutes };

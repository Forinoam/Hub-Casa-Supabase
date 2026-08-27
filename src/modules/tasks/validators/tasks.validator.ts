import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Informe o título."),
  category: z.string().min(1),
  due_date: z.string().optional().nullable(),
});

export type CreateTaskValues = z.infer<typeof createTaskSchema>;

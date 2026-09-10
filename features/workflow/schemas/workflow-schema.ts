import { z } from 'zod';

export const createWorkflowSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: '워크플로우 이름을 입력해 주세요.' })
    .max(100, { message: '워크플로우 이름은 100자 이하로 입력해 주세요.' }),
  description: z
    .string()
    .trim()
    .max(500, { message: '설명은 500자 이하로 입력해 주세요.' })
    .optional(),
});

export const updateWorkflowSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: '워크플로우 이름을 입력해 주세요.' })
    .max(100, { message: '워크플로우 이름은 100자 이하로 입력해 주세요.' })
    .optional(),
  description: z
    .string()
    .trim()
    .max(500, { message: '설명은 500자 이하로 입력해 주세요.' })
    .optional(),
});

export type CreateWorkflowSchemaType = z.infer<typeof createWorkflowSchema>;
export type UpdateWorkflowSchemaType = z.infer<typeof updateWorkflowSchema>;

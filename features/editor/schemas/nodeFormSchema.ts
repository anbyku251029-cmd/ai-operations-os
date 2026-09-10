import { z } from 'zod';

export const nodeFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, '단계 이름을 1자 이상 입력해 주세요.')
    .max(100, '단계 이름은 최대 100자까지 가능합니다.'),
  owner: z.string().max(50, '담당자 이름은 최대 50자까지 가능합니다.').optional().default(''),
  role: z.string().max(50, '역할 이름은 최대 50자까지 가능합니다.').optional().default(''),
  tool: z.string().max(50, '도구 이름은 최대 50자까지 가능합니다.').optional().default(''),
  description: z.string().max(1000, '설명은 최대 1,000자까지 가능합니다.').optional().default(''),
  durationMinutes: z
    .union([z.number(), z.string(), z.null()])
    .optional()
    .transform((val) => {
      if (val === '' || val === null || val === undefined) return null;
      const num = Number(val);
      return isNaN(num) ? null : num;
    })
    .refine((val) => val === null || val >= 0, {
      message: '소요 시간은 0분 이상이어야 합니다.',
    }),
  costAmount: z
    .union([z.number(), z.string(), z.null()])
    .optional()
    .transform((val) => {
      if (val === '' || val === null || val === undefined) return null;
      const num = Number(val);
      return isNaN(num) ? null : num;
    })
    .refine((val) => val === null || val >= 0, {
      message: '비용은 0원 이상이어야 합니다.',
    }),
  notes: z.string().max(1000, '메모는 최대 1,000자까지 가능합니다.').optional().default(''),
});

export type NodeFormValues = z.infer<typeof nodeFormSchema>;

import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: '이메일을 입력해 주세요.' })
    .email({ message: '올바른 이메일 형식을 입력해 주세요.' }),
  password: z
    .string()
    .min(1, { message: '비밀번호를 입력해 주세요.' }),
});

export const signupSchema = z
  .object({
    email: z
      .string()
      .min(1, { message: '이메일을 입력해 주세요.' })
      .email({ message: '올바른 이메일 형식을 입력해 주세요.' }),
    password: z
      .string()
      .min(6, { message: '비밀번호는 최소 6자 이상이어야 합니다.' }),
    confirmPassword: z
      .string()
      .min(1, { message: '비밀번호 확인을 입력해 주세요.' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '비밀번호가 일치하지 않습니다.',
    path: ['confirmPassword'],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;

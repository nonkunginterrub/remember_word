// zod schemas ที่ใช้ร่วมกันทั้งฟอร์มฝั่งหน้าเว็บและ API
import { z } from 'zod';

export const credentialsSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email({ error: 'รูปแบบอีเมลไม่ถูกต้อง' })),
  password: z
    .string()
    .min(8, { error: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' })
    .max(72, { error: 'รหัสผ่านยาวได้ไม่เกิน 72 ตัวอักษร' }),
});

export const wordSchema = z.object({
  word: z
    .string()
    .trim()
    .min(1, { error: 'กรุณากรอกคำศัพท์' })
    .max(100, { error: 'คำศัพท์ยาวได้ไม่เกิน 100 ตัวอักษร' }),
  meaning: z
    .string()
    .trim()
    .min(1, { error: 'กรุณากรอกความหมาย' })
    .max(500, { error: 'ความหมายยาวได้ไม่เกิน 500 ตัวอักษร' }),
  example: z
    .string()
    .trim()
    .max(500, { error: 'ประโยคตัวอย่างยาวได้ไม่เกิน 500 ตัวอักษร' })
    .optional()
    .default(''),
});

export const answerSchema = z.object({
  wordId: z.number().int().positive(),
  answer: z.string().max(200),
});

export type Credentials = z.output<typeof credentialsSchema>;
export type WordFormValues = z.input<typeof wordSchema>;
export type WordInput = z.output<typeof wordSchema>;
export type AnswerInput = z.output<typeof answerSchema>;

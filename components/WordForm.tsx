'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { wordSchema, type WordFormValues, type WordInput } from '@/lib/validators';
import type { Word } from '@/types';

const EMPTY: WordFormValues = { word: '', meaning: '', example: '' };

interface WordFormProps {
  initialValues?: Word;
  /** ต้องคืน true เมื่อบันทึกสำเร็จ (ฟอร์มเพิ่มคำจะล้างค่าให้) */
  onSubmit: (values: WordInput) => Promise<boolean>;
  onCancel?: () => void;
}

/** ฟอร์มเพิ่ม/แก้ไขคำ */
export default function WordForm({ initialValues, onSubmit, onCancel }: WordFormProps) {
  const isEdit = Boolean(initialValues);
  const {
    register,
    handleSubmit,
    reset,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<WordFormValues, unknown, WordInput>({
    resolver: zodResolver(wordSchema),
    defaultValues: initialValues
      ? { word: initialValues.word, meaning: initialValues.meaning, example: initialValues.example }
      : EMPTY,
  });

  async function submit(values: WordInput) {
    const ok = await onSubmit(values);
    if (ok && !isEdit) {
      reset(EMPTY);
      setFocus('word');
    }
  }

  return (
    <form className="card word-form" onSubmit={handleSubmit(submit)} noValidate>
      <h2>{initialValues ? `แก้ไขคำ "${initialValues.word}"` : 'เพิ่มคำใหม่'}</h2>
      <div className="form-grid">
        <label className="field">
          <span>คำศัพท์ *</span>
          <input autoComplete="off" placeholder="เช่น persevere" {...register('word')} />
          {errors.word && <small className="error">{errors.word.message}</small>}
        </label>
        <label className="field">
          <span>ความหมาย *</span>
          <input autoComplete="off" placeholder="เช่น อดทน, พากเพียร" {...register('meaning')} />
          {errors.meaning && <small className="error">{errors.meaning.message}</small>}
        </label>
      </div>
      <label className="field">
        <span>ประโยคตัวอย่าง</span>
        <textarea rows={2} placeholder="เช่น You must persevere to succeed." {...register('example')} />
        {errors.example && <small className="error">{errors.example.message}</small>}
      </label>
      <div className="row gap">
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'กำลังบันทึก...' : isEdit ? 'บันทึกการแก้ไข' : 'เพิ่มคำ'}
        </button>
        {isEdit && (
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            ยกเลิก
          </button>
        )}
      </div>
    </form>
  );
}

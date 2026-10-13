// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import QuizCard from '@/components/QuizCard';
import type { Question } from '@/types';

const question: Question = {
  wordId: 1,
  meaning: 'อดทน',
  example: 'You must _____.',
  hint: 'p _ _ _ _ _ _ _ _',
  answer: null,
};

afterEach(cleanup);

describe('QuizCard', () => {
  it('แสดงความหมาย และส่งคำตอบที่พิมพ์', () => {
    const onSubmit = vi.fn();
    render(<QuizCard question={question} onSubmit={onSubmit} onNext={() => {}} />);

    expect(screen.getByText('อดทน')).toBeTruthy();
    const button = screen.getByRole('button', { name: 'ตอบ' }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);

    fireEvent.change(screen.getByLabelText('พิมพ์คำศัพท์'), { target: { value: 'persevere' } });
    fireEvent.click(screen.getByRole('button', { name: 'ตอบ' }));
    expect(onSubmit).toHaveBeenCalledWith('persevere');
  });

  it('เมื่อมีผลลัพธ์ แสดงเฉลยและปุ่มข้อต่อไป', () => {
    const onNext = vi.fn();
    const result = { userAnswer: 'persever', isCorrect: false, correctWord: 'persevere' };
    render(<QuizCard question={question} result={result} onSubmit={() => {}} onNext={onNext} />);

    expect(screen.getByText(/คำตอบคือ/)).toBeTruthy();
    expect(screen.getByText('persevere')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'ข้อต่อไป →' }));
    expect(onNext).toHaveBeenCalled();
  });
});

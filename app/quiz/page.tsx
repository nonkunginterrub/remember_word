'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import ProgressBar from '@/components/ProgressBar';
import QuizCard from '@/components/QuizCard';
import {
  getErrorMessage,
  useFinishQuizMutation,
  useGetTodayQuizQuery,
  useSubmitAnswerMutation,
} from '@/store/apiSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { answerRecorded, nextQuestion, selectQuiz, selectScore, startQuiz } from '@/store/quizSlice';
import { addToast } from '@/store/uiSlice';
import type { AnswerResult } from '@/types';

export default function QuizPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const quiz = useAppSelector(selectQuiz);
  const score = useAppSelector(selectScore);

  const { data, isLoading, error } = useGetTodayQuizQuery();
  const [submitAnswer, { isLoading: submitting }] = useSubmitAnswerMutation();
  const [finishQuiz, { isLoading: finishing }] = useFinishQuizMutation();

  // ข้อที่ตอบแล้วอยู่ก่อน เพื่อให้ทำต่อจากที่ค้างไว้ได้
  const questions = useMemo(() => {
    const list = data?.questions ?? [];
    return [...list.filter((q) => q.answer), ...list.filter((q) => !q.answer)];
  }, [data]);

  // เริ่มรอบใหม่ใน Redux เมื่อได้ชุดคำของวันนี้ (หรือชุดคำเปลี่ยน)
  useEffect(() => {
    if (!data || data.empty || data.finished || data.id === null) return;
    if (quiz.setId === data.id && quiz.total === questions.length) return;
    const results: AnswerResult[] = questions.flatMap((q) => (q.answer ? [{ wordId: q.wordId, ...q.answer }] : []));
    dispatch(startQuiz({ setId: data.id, total: questions.length, results }));
  }, [data, questions, quiz.setId, quiz.total, dispatch]);

  if (isLoading) return <p className="muted center">กำลังโหลด...</p>;
  if (error || !data) return <p className="alert alert-error">{getErrorMessage(error)}</p>;

  if (data.empty) {
    return (
      <div className="card center stack">
        <h1>ยังไม่มีคำให้ทาย</h1>
        <p className="muted">เพิ่มคำศัพท์ในคลังคำก่อน แล้วกลับมาทายได้เลย</p>
        <Link href="/words" className="btn btn-primary">
          + เพิ่มคำศัพท์
        </Link>
      </div>
    );
  }

  if (data.finished) {
    return (
      <div className="card center stack">
        <h1>วันนี้ทบทวนครบแล้ว 🎉</h1>
        <p className="muted">กลับมาใหม่พรุ่งนี้ เพื่อรับคำชุดใหม่</p>
        <Link href="/quiz/result" className="btn btn-primary">
          ดูผลของวันนี้
        </Link>
      </div>
    );
  }

  if (quiz.setId !== data.id) return <p className="muted center">กำลังเตรียมคำถาม...</p>;

  async function handleAnswer(answer: string) {
    const question = questions[quiz.currentIndex];
    try {
      const result = await submitAnswer({ wordId: question.wordId, answer }).unwrap();
      dispatch(answerRecorded(result));
    } catch (err) {
      dispatch(addToast(getErrorMessage(err), 'error'));
    }
  }

  async function handleFinish() {
    try {
      await finishQuiz().unwrap();
      router.push('/quiz/result');
    } catch (err) {
      dispatch(addToast(getErrorMessage(err), 'error'));
    }
  }

  if (quiz.status === 'finished') {
    return (
      <div className="card center stack">
        <h1>ตอบครบทุกข้อแล้ว</h1>
        <p className="score-big">
          {score}/{quiz.total}
        </p>
        <button type="button" className="btn btn-primary" onClick={handleFinish} disabled={finishing}>
          {finishing ? 'กำลังบันทึก...' : 'บันทึกผลและดูสรุป'}
        </button>
      </div>
    );
  }

  const question = questions[quiz.currentIndex];
  const result = quiz.status === 'revealed' ? (quiz.results.at(-1) ?? null) : null;
  const isLast = quiz.currentIndex === quiz.total - 1;

  return (
    <div className="stack quiz-page">
      <div className="row between">
        <h1>ทายคำวันนี้</h1>
        <span className="muted">ถูก {score} ข้อ</span>
      </div>
      <ProgressBar
        value={quiz.currentIndex + (result ? 1 : 0)}
        max={quiz.total}
        label={`ข้อ ${quiz.currentIndex + 1} จาก ${quiz.total}`}
      />
      <QuizCard
        key={question.wordId}
        question={question}
        result={result}
        submitting={submitting}
        isLast={isLast}
        onSubmit={handleAnswer}
        onNext={isLast ? handleFinish : () => dispatch(nextQuestion())}
      />
    </div>
  );
}

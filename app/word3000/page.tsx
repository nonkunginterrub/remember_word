'use client';

import { useCallback, useEffect, useState } from 'react';
import QuizCard from '@/components/QuizCard';
import { WORD3000_LEVELS } from '@/lib/validators';
import {
  getErrorMessage,
  useAddWordMutation,
  useGetWord3000QuestionMutation,
  useSubmitWord3000AnswerMutation,
} from '@/store/apiSlice';
import { useAppDispatch } from '@/store/hooks';
import { addToast } from '@/store/uiSlice';
import type { Word3000Level, Word3000Question, Word3000Result } from '@/types';

// จำคำที่เพิ่งทายไว้ เพื่อไม่ให้สุ่มซ้ำเร็วเกินไป
const RECENT_LIMIT = 50;

const LEVEL_LABEL: Record<Word3000Level, string> = {
  A1: 'A1 เริ่มต้น',
  A2: 'A2 พื้นฐาน',
  B1: 'B1 กลาง',
  B2: 'B2 กลางสูง',
};

export default function Word3000Page() {
  const dispatch = useAppDispatch();
  const [level, setLevel] = useState<Word3000Level | null>(null);
  const [question, setQuestion] = useState<Word3000Question | null>(null);
  const [result, setResult] = useState<Word3000Result | null>(null);
  const [recent, setRecent] = useState<number[]>([]);
  const [score, setScore] = useState({ correct: 0, total: 0, streak: 0 });
  const [added, setAdded] = useState<number[]>([]);

  const [getQuestion, { isLoading: loading, error }] = useGetWord3000QuestionMutation();
  const [submitAnswer, { isLoading: submitting }] = useSubmitWord3000AnswerMutation();
  const [addWord, { isLoading: adding }] = useAddWordMutation();

  const loadQuestion = useCallback(
    (nextLevel: Word3000Level | null, exclude: number[]) =>
      getQuestion({ level: nextLevel, exclude })
        .unwrap()
        .then((next) => {
          setQuestion(next);
          setResult(null);
          setRecent((ids) => [...ids, next.id].slice(-RECENT_LIMIT));
        })
        .catch(() => {
          // แสดงข้อความจาก error ของ mutation ด้านล่าง
        }),
    [getQuestion],
  );

  // โหลดคำถามแรกเมื่อเปิดหน้า
  useEffect(() => {
    void loadQuestion(null, []);
  }, [loadQuestion]);

  function changeLevel(nextLevel: Word3000Level | null) {
    setLevel(nextLevel);
    loadQuestion(nextLevel, recent);
  }

  async function handleAnswer(answer: string) {
    if (!question) return;
    try {
      const res = await submitAnswer({ id: question.id, answer }).unwrap();
      setResult(res);
      setScore((s) => ({
        correct: s.correct + (res.isCorrect ? 1 : 0),
        total: s.total + 1,
        streak: res.isCorrect ? s.streak + 1 : 0,
      }));
    } catch (err) {
      dispatch(addToast(getErrorMessage(err), 'error'));
    }
  }

  async function handleAddWord() {
    if (!result) return;
    try {
      await addWord({ word: result.correctWord, meaning: result.meaning, example: '' }).unwrap();
      setAdded((ids) => [...ids, result.id]);
      dispatch(addToast(`เพิ่ม "${result.correctWord}" เข้าคลังคำแล้ว`, 'success'));
    } catch (err) {
      dispatch(addToast(getErrorMessage(err), 'error'));
    }
  }

  return (
    <div className="stack quiz-page">
      <div className="row between wrap gap">
        <h1>ทายคำ Oxford 3000</h1>
        <span className="muted">
          ถูก {score.correct}/{score.total} · ติดกัน {score.streak} 🔥
        </span>
      </div>

      <div className="level-tabs" role="group" aria-label="เลือกระดับคำศัพท์">
        <button
          type="button"
          className={level === null ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-ghost'}
          aria-pressed={level === null}
          onClick={() => changeLevel(null)}
          disabled={loading}
        >
          ทุกระดับ
        </button>
        {WORD3000_LEVELS.map((l) => (
          <button
            key={l}
            type="button"
            className={level === l ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-ghost'}
            aria-pressed={level === l}
            onClick={() => changeLevel(l)}
            disabled={loading}
          >
            {LEVEL_LABEL[l]}
          </button>
        ))}
      </div>

      {error && !question && <p className="alert alert-error">{getErrorMessage(error)}</p>}
      {!question && !error && <p className="muted center">กำลังโหลด...</p>}

      {question && (
        <>
          <p className="muted small">
            <span className="badge level-badge">{question.level}</span> {question.pos}
          </p>
          <QuizCard
            key={question.id}
            question={{
              wordId: question.id,
              meaning: question.meaning,
              example: null,
              hint: question.hint,
              answer: null,
            }}
            result={result}
            submitting={submitting || loading}
            onSubmit={handleAnswer}
            onNext={() => loadQuestion(level, recent)}
          />
          {result && (
            <button
              type="button"
              className="btn btn-ghost btn-block"
              onClick={handleAddWord}
              disabled={adding || added.includes(result.id)}
            >
              {added.includes(result.id) ? '✓ อยู่ในคลังคำแล้ว' : '+ เพิ่มคำนี้เข้าคลังคำของฉัน'}
            </button>
          )}
        </>
      )}
    </div>
  );
}

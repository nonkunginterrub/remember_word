'use client';

import { useState, type FormEvent } from 'react';
import type { Question, QuestionAnswer } from '@/types';

interface QuizCardProps {
  question: Question;
  result?: QuestionAnswer | null;
  submitting?: boolean;
  isLast?: boolean;
  onSubmit: (answer: string) => void;
  onNext: () => void;
}

/**
 * การ์ดคำถาม 1 ข้อ: แสดงความหมาย -> ผู้ใช้พิมพ์คำศัพท์ -> แสดงเฉลย
 * ใช้ key={question.wordId} จากหน้าแม่ เพื่อล้างค่าที่พิมพ์เมื่อเปลี่ยนข้อ
 */
export default function QuizCard({ question, result, submitting, isLast, onSubmit, onNext }: QuizCardProps) {
  const [answer, setAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (result) {
      onNext();
    } else if (answer.trim()) {
      onSubmit(answer);
    }
  }

  return (
    <form className="card quiz-card" onSubmit={handleSubmit}>
      <p className="quiz-label">ความหมาย</p>
      <p className="quiz-meaning">{question.meaning}</p>
      {question.example && <p className="quiz-example">“{question.example}”</p>}

      {showHint || result ? (
        <p className="quiz-hint">คำใบ้: {question.hint}</p>
      ) : (
        <button type="button" className="btn btn-link" onClick={() => setShowHint(true)}>
          💡 ขอคำใบ้
        </button>
      )}

      <input
        className="quiz-input"
        aria-label="พิมพ์คำศัพท์"
        placeholder="พิมพ์คำศัพท์..."
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        autoFocus
        value={result ? result.userAnswer : answer}
        onChange={(e) => setAnswer(e.target.value)}
        readOnly={Boolean(result) || submitting}
      />

      {result && (
        <div className={`alert ${result.isCorrect ? 'alert-success' : 'alert-error'}`}>
          {result.isCorrect ? (
            <>
              ✅ ถูกต้อง! <strong>{result.correctWord}</strong>
            </>
          ) : (
            <>
              ❌ ยังไม่ถูก คำตอบคือ <strong>{result.correctWord}</strong>
            </>
          )}
        </div>
      )}

      {result ? (
        <button type="submit" className="btn btn-primary btn-block" autoFocus>
          {isLast ? 'ดูสรุปผล' : 'ข้อต่อไป →'}
        </button>
      ) : (
        <button type="submit" className="btn btn-primary btn-block" disabled={submitting || !answer.trim()}>
          {submitting ? 'กำลังตรวจ...' : 'ตอบ'}
        </button>
      )}
    </form>
  );
}

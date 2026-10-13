'use client';

import Link from 'next/link';
import { getErrorMessage, useGetTodayQuizQuery } from '@/store/apiSlice';

function message(score: number, total: number): string {
  const ratio = total ? score / total : 0;
  if (ratio === 1) return 'สุดยอด! ตอบถูกทุกข้อ 🏆';
  if (ratio >= 0.7) return 'เก่งมาก! 🎉';
  if (ratio >= 0.4) return 'ทำได้ดี ทบทวนต่อไปเรื่อย ๆ 💪';
  return 'ไม่เป็นไร คำที่ผิดจะกลับมาให้ทบทวนพรุ่งนี้ 📖';
}

export default function QuizResultPage() {
  const { data, isLoading, error } = useGetTodayQuizQuery();

  if (isLoading) return <p className="muted center">กำลังโหลด...</p>;
  if (error || !data) return <p className="alert alert-error">{getErrorMessage(error)}</p>;

  if (data.empty || !data.finished) {
    return (
      <div className="card center stack">
        <h1>ยังทำแบบทดสอบวันนี้ไม่เสร็จ</h1>
        <Link href="/quiz" className="btn btn-primary">
          ไปทายคำ
        </Link>
      </div>
    );
  }

  const score = data.score ?? 0;

  return (
    <div className="stack">
      <section className="card center stack">
        <p className="muted">ผลของวันนี้</p>
        <p className="score-big">
          {score}/{data.total}
        </p>
        <h1>{message(score, data.total)}</h1>
        <Link href="/" className="btn btn-primary">
          กลับหน้าแรก
        </Link>
      </section>

      <ul className="word-list">
        {data.questions.map((q) => (
          <li key={q.wordId} className={`card result-item ${q.answer?.isCorrect ? 'ok' : 'bad'}`}>
            <span className="result-icon">{q.answer?.isCorrect ? '✅' : '❌'}</span>
            <div>
              <strong>{q.answer?.correctWord}</strong> <span className="muted">— {q.meaning}</span>
              {!q.answer?.isCorrect && <p className="small text-danger">คุณตอบ: {q.answer?.userAnswer || '(ว่าง)'}</p>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { getErrorMessage, useGetStatsQuery } from '@/store/apiSlice';
import { DAILY_WORD_COUNT } from '@/lib/scheduler';
import type { TodayStatus } from '@/types';

const TODAY_STATUS: Record<TodayStatus, { text: string; cta: string }> = {
  not_started: { text: 'ยังไม่ได้ทบทวน', cta: 'เริ่มทายคำวันนี้' },
  in_progress: { text: 'ทำค้างไว้', cta: 'ทำต่อ' },
  done: { text: 'ทบทวนแล้ว ✅', cta: 'ดูผลวันนี้' },
};

export default function DashboardPage() {
  const { data: stats, isLoading, error } = useGetStatsQuery();

  if (isLoading) return <p className="muted center">กำลังโหลด...</p>;
  if (error || !stats) return <p className="alert alert-error">{getErrorMessage(error)}</p>;

  const status = TODAY_STATUS[stats.todayStatus];
  const maxBox = Math.max(1, ...stats.boxes.map((b) => b.count));

  return (
    <div className="stack">
      <section className="card hero">
        <div>
          <p className="muted">วันนี้</p>
          <h1>{status.text}</h1>
          <p className="muted">
            {stats.totalWords === 0
              ? 'เริ่มจากเพิ่มคำศัพท์ในคลังคำก่อนนะครับ'
              : `ทายคำวันละ ${DAILY_WORD_COUNT} คำ · ถึงกำหนดทบทวน ${stats.dueWords} คำ · คำใหม่ ${stats.newWords} คำ`}
          </p>
        </div>
        {stats.totalWords === 0 ? (
          <Link href="/words" className="btn btn-primary">
            + เพิ่มคำศัพท์
          </Link>
        ) : (
          <Link href={stats.todayStatus === 'done' ? '/quiz/result' : '/quiz'} className="btn btn-primary">
            {status.cta}
          </Link>
        )}
      </section>

      <section className="stat-grid">
        <div className="card stat">
          <span className="stat-value">🔥 {stats.streak}</span>
          <span className="stat-label">วันติดต่อกัน</span>
        </div>
        <div className="card stat">
          <span className="stat-value">{stats.totalWords}</span>
          <span className="stat-label">คำในคลัง</span>
        </div>
        <div className="card stat">
          <span className="stat-value">{stats.boxes[4].count}</span>
          <span className="stat-label">คำที่จำได้แม่น (กล่อง 5)</span>
        </div>
      </section>

      <section className="card">
        <h2>คำในแต่ละกล่อง</h2>
        <p className="muted small">ตอบถูกเลื่อนขึ้น 1 กล่อง · ตอบผิดกลับกล่อง 1 · กล่องสูงยิ่งเว้นระยะทบทวนนาน</p>
        <div className="box-chart">
          {stats.boxes.map((b) => (
            <div key={b.box} className="box-row">
              <span className="box-name">กล่อง {b.box}</span>
              <div className="box-track">
                <div className={`box-fill box-${b.box}`} style={{ width: `${(b.count / maxBox) * 100}%` }} />
              </div>
              <span className="box-count">{b.count}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="two-col">
        <section className="card">
          <h2>คะแนนล่าสุด</h2>
          {stats.recent.length === 0 ? (
            <p className="muted">ยังไม่มีประวัติ</p>
          ) : (
            <ul className="simple-list">
              {stats.recent.map((r) => (
                <li key={r.date}>
                  <span>{new Date(`${r.date}T00:00:00`).toLocaleDateString('th-TH', { dateStyle: 'medium' })}</span>
                  <strong>
                    {r.score}/{r.total}
                  </strong>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <h2>คำที่ผิดบ่อย</h2>
          {stats.mostMissed.length === 0 ? (
            <p className="muted">ยังไม่มีคำที่ตอบผิด 👍</p>
          ) : (
            <ul className="simple-list">
              {stats.mostMissed.map((w) => (
                <li key={w.id}>
                  <span>
                    <strong>{w.word}</strong> <span className="muted">— {w.meaning}</span>
                  </span>
                  <span className="text-danger">ผิด {w.wrongCount}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

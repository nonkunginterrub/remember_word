'use client';

import { useState } from 'react';
import type { Word } from '@/types';

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'คำใหม่';
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
}

interface WordListProps {
  words: Word[];
  onEdit: (word: Word) => void;
  onDelete: (word: Word) => void;
  deletingId: number | null;
}

export default function WordList({ words, onEdit, onDelete, deletingId }: WordListProps) {
  // ยืนยันการลบแบบ 2 ขั้นตอนในปุ่มเดียว (ไม่ใช้ window.confirm)
  const [confirmId, setConfirmId] = useState<number | null>(null);

  if (words.length === 0) {
    return <p className="muted center">ยังไม่มีคำศัพท์</p>;
  }

  return (
    <ul className="word-list">
      {words.map((w) => (
        <li key={w.id} className="card word-item">
          <div className="word-main">
            <div className="word-head">
              <strong className="word-text">{w.word}</strong>
              <span className={`badge box-${w.box}`}>กล่อง {w.box}</span>
            </div>
            <p className="word-meaning">{w.meaning}</p>
            {w.example && <p className="word-example">“{w.example}”</p>}
            <p className="word-meta">
              ทบทวนถัดไป: {formatDate(w.nextReview)} · ถูก {w.correctCount} · ผิด {w.wrongCount}
            </p>
          </div>
          <div className="word-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onEdit(w)}>
              แก้ไข
            </button>
            {confirmId === w.id ? (
              <>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  disabled={deletingId === w.id}
                  onClick={() => onDelete(w)}
                >
                  ยืนยันลบ
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirmId(null)}>
                  ไม่ลบ
                </button>
              </>
            ) : (
              <button type="button" className="btn btn-ghost btn-sm text-danger" onClick={() => setConfirmId(w.id)}>
                ลบ
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

'use client';

import { useDeferredValue, useState } from 'react';
import WordForm from '@/components/WordForm';
import WordList from '@/components/WordList';
import {
  getErrorMessage,
  useAddWordMutation,
  useDeleteWordMutation,
  useGetWordsQuery,
  useUpdateWordMutation,
} from '@/store/apiSlice';
import { useAppDispatch } from '@/store/hooks';
import { addToast } from '@/store/uiSlice';
import type { WordInput } from '@/lib/validators';
import type { Word } from '@/types';

export default function WordsPage() {
  const dispatch = useAppDispatch();
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search.trim());
  const [editing, setEditing] = useState<Word | null>(null);

  const { data: words = [], isLoading, isFetching, error } = useGetWordsQuery(deferredSearch);
  const [addWord] = useAddWordMutation();
  const [updateWord] = useUpdateWordMutation();
  const [deleteWord, { isLoading: isDeleting, originalArgs: deletingId }] = useDeleteWordMutation();

  async function handleAdd(values: WordInput): Promise<boolean> {
    try {
      await addWord(values).unwrap();
      dispatch(addToast(`เพิ่มคำ "${values.word}" แล้ว`));
      return true;
    } catch (err) {
      dispatch(addToast(getErrorMessage(err), 'error'));
      return false;
    }
  }

  async function handleUpdate(values: WordInput): Promise<boolean> {
    if (!editing) return false;
    try {
      await updateWord({ id: editing.id, ...values }).unwrap();
      dispatch(addToast('บันทึกการแก้ไขแล้ว'));
      setEditing(null);
      return true;
    } catch (err) {
      dispatch(addToast(getErrorMessage(err), 'error'));
      return false;
    }
  }

  async function handleDelete(word: Word) {
    try {
      await deleteWord(word.id).unwrap();
      dispatch(addToast(`ลบคำ "${word.word}" แล้ว`));
      if (editing?.id === word.id) setEditing(null);
    } catch (err) {
      dispatch(addToast(getErrorMessage(err), 'error'));
    }
  }

  return (
    <div className="stack">
      <h1>คลังคำศัพท์</h1>

      {editing ? (
        <WordForm key={editing.id} initialValues={editing} onSubmit={handleUpdate} onCancel={() => setEditing(null)} />
      ) : (
        <WordForm key="new" onSubmit={handleAdd} />
      )}

      <div className="row between wrap gap">
        <input
          className="search"
          type="search"
          placeholder="🔍 ค้นหาคำหรือความหมาย..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="muted">{isFetching ? 'กำลังโหลด...' : `${words.length} คำ`}</span>
      </div>

      {error && <p className="alert alert-error">{getErrorMessage(error)}</p>}
      {isLoading ? (
        <p className="muted center">กำลังโหลด...</p>
      ) : (
        <WordList
          words={words}
          onEdit={(w) => {
            setEditing(w);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onDelete={handleDelete}
          deletingId={isDeleting ? (deletingId ?? null) : null}
        />
      )}
    </div>
  );
}

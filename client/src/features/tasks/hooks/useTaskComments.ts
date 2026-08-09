import { useCallback, useEffect, useState } from 'react';
import type { CommentDTO } from '@ems/shared';
import * as tasksApi from '../api/tasksApi';

export function useTaskComments(taskId: string | null, open: boolean) {
  const [comments, setComments] = useState<CommentDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !taskId) return undefined;
    let active = true;
    setLoading(true);
    tasksApi
      .listComments(taskId)
      .then((list) => {
        if (active) setComments(list);
      })
      .catch(() => {
        if (active) setComments([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open, taskId]);

  const addComment = useCallback(
    async (body: string) => {
      if (!taskId) return;
      setSubmitting(true);
      try {
        const created = await tasksApi.addComment(taskId, { body });
        setComments((prev) => [...prev, created]);
      } finally {
        setSubmitting(false);
      }
    },
    [taskId],
  );

  const resetDraftState = useCallback(() => {
    setComments([]);
  }, []);

  return { comments, loading, submitting, addComment, resetDraftState };
}

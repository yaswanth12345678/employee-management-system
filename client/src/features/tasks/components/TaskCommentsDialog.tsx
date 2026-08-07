import { useEffect, useState } from 'react';
import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import type { CommentDTO, TaskDTO } from '@ems/shared';
import { Button } from '../../../components/ui/Button';
import { useSnackbar } from '../../../contexts/SnackbarContext';
import type { NormalizedError } from '../../../lib/http';
import * as tasksApi from '../api/tasksApi';

interface TaskCommentsDialogProps {
  open: boolean;
  task: TaskDTO | null;
  onClose: () => void;
  onChanged: () => void; // refresh the task list (comment count)
}

export function TaskCommentsDialog({ open, task, onClose, onChanged }: TaskCommentsDialogProps) {
  const { notify } = useSnackbar();
  const [comments, setComments] = useState<CommentDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !task) return undefined;
    let active = true;
    setLoading(true);
    setBody('');
    tasksApi
      .listComments(task.id)
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
  }, [open, task]);

  const handleAdd = async () => {
    if (!task || !body.trim()) return;
    setSubmitting(true);
    try {
      const created = await tasksApi.addComment(task.id, { body: body.trim() });
      setComments((prev) => [...prev, created]);
      setBody('');
      onChanged();
    } catch (err) {
      notify((err as NormalizedError).message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{task ? `Comments — ${task.title}` : 'Comments'}</DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Typography variant="body2" color="text.secondary">
            Loading…
          </Typography>
        ) : comments.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No comments yet. Be the first to comment.
          </Typography>
        ) : (
          <Stack spacing={2}>
            {comments.map((comment) => (
              <Box key={comment.id}>
                <Typography variant="subtitle2">
                  {comment.author
                    ? `${comment.author.firstName} ${comment.author.lastName}`
                    : 'Unknown'}
                  <Typography component="span" variant="caption" color="text.disabled" sx={{ ml: 1 }}>
                    {new Date(comment.createdAt).toLocaleString()}
                  </Typography>
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {comment.body}
                </Typography>
              </Box>
            ))}
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
          <TextField
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Add a comment…"
            fullWidth
            size="small"
            multiline
            maxRows={4}
            // Disabled until the initial fetch resolves: posting mid-load would optimistically append
            // a comment that the still-in-flight listComments response would then clobber.
            disabled={loading}
          />
          <Button
            variant="contained"
            onClick={handleAdd}
            loading={submitting}
            disabled={!body.trim() || loading}
          >
            Post
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}

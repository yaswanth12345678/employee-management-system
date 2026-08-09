import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';
import type { TaskDTO } from '@ems/shared';
import { Button } from '../../../components/ui/Button';
import { FormTextField } from '../../../components/forms/FormTextField';
import { useSnackbar } from '../../../contexts/SnackbarContext';
import type { NormalizedError } from '../../../lib/http';
import { useTaskComments } from '../hooks/useTaskComments';
import { taskCommentSchema, type TaskCommentValues } from '../validation';

interface TaskCommentsDialogProps {
  open: boolean;
  task: TaskDTO | null;
  onClose: () => void;
  onChanged: () => void;
}

export function TaskCommentsDialog({ open, task, onClose, onChanged }: TaskCommentsDialogProps) {
  const { notify } = useSnackbar();
  const { comments, loading, submitting, addComment } = useTaskComments(task?.id ?? null, open);
  const { control, handleSubmit, reset } = useForm<TaskCommentValues>({
    resolver: zodResolver(taskCommentSchema),
    defaultValues: { body: '' },
  });

  useEffect(() => {
    if (open) reset({ body: '' });
  }, [open, task?.id, reset]);

  const onSubmit = async (values: TaskCommentValues) => {
    try {
      await addComment(values.body.trim());
      reset({ body: '' });
      onChanged();
    } catch (err) {
      notify((err as NormalizedError).message, 'error');
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
        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          sx={{ width: '100%' }}
        >
          <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
            <FormTextField
              control={control}
              name="body"
              placeholder="Add a comment…"
              fullWidth
              size="small"
              multiline
              maxRows={4}
              disabled={loading}
            />
            <Button type="submit" variant="contained" loading={submitting} disabled={loading}>
              Post
            </Button>
          </Stack>
        </Box>
      </DialogActions>
    </Dialog>
  );
}

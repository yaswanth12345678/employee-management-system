import { QRCodeSVG } from 'qrcode.react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import type { EmployeeDTO } from '@ems/shared';
import { useSnackbar } from '../../../contexts/SnackbarContext';
import { employeeQrUrl } from '../lib/employeeQr';

interface EmployeeQrDialogProps {
  employee: EmployeeDTO | null;
  open: boolean;
  onClose: () => void;
}

/** Shows a unique QR for an employee. Scanning opens their profile card page. */
export function EmployeeQrDialog({ employee, open, onClose }: EmployeeQrDialogProps) {
  const { notify } = useSnackbar();
  const url = employee ? employeeQrUrl(employee.id) : '';

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      notify('QR link copied', 'success');
    } catch {
      notify('Could not copy link', 'error');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Employee QR code</DialogTitle>
      <DialogContent>
        {employee && (
          <Stack spacing={2} alignItems="center" sx={{ py: 1 }}>
            <Typography variant="subtitle1" fontWeight={700} textAlign="center">
              {employee.firstName} {employee.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {employee.employeeCode} · unique ID
            </Typography>
            <Box
              sx={{
                p: 2,
                bgcolor: 'common.white',
                borderRadius: 2,
                border: 1,
                borderColor: 'divider',
                lineHeight: 0,
              }}
            >
              <QRCodeSVG value={url} size={220} level="M" includeMargin />
            </Box>
            <Typography
              variant="caption"
              color="text.secondary"
              textAlign="center"
              sx={{ wordBreak: 'break-all' }}
            >
              Scan to open employee info. Use this device&apos;s URL (LAN IP if scanning from a
              phone).
            </Typography>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button startIcon={<ContentCopyIcon />} onClick={() => void copyLink()} disabled={!employee}>
          Copy link
        </Button>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

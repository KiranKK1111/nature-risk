import React, { useState } from "react";
import {
  IconButton, Tooltip, Dialog, DialogTitle, DialogContent,
  DialogContentText, DialogActions, Button,
} from "@mui/material";
import CachedIcon from "@mui/icons-material/Cached";
import { clearAllCache } from "../../services/indexedDBCache";

export default function HardRefreshButton() {
  const [open, setOpen] = useState(false);

  const handleConfirm = async () => {
    setOpen(false);
    await clearAllCache();
    window.location.reload();
  };

  return (
    <>
      <Tooltip title="Clear cache &amp; reload" arrow>
        <IconButton
          onClick={() => setOpen(true)}
          sx={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            zIndex: 1300,
            bgcolor: '#fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            width: 44,
            height: 44,
            '&:hover': { bgcolor: '#e8f5e9' },
          }}
        >
          <CachedIcon sx={{ color: '#2e7d32', fontSize: 24 }} />
        </IconButton>
      </Tooltip>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            px: 1,
            py: 0.5,
            maxWidth: 420,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#1b5e20', display: 'flex', alignItems: 'center', gap: 1 }}>
          <CachedIcon sx={{ color: '#2e7d32' }} />
          Hard Refresh
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'text.primary', fontSize: 14.5 }}>
            This will <strong>clear all locally cached layer data</strong> and
            re-download everything from the server.
          </DialogContentText>
          <DialogContentText sx={{ mt: 1.5, fontSize: 13, color: 'text.secondary' }}>
            Only do this if you know new data has been published on the server.
            If the data hasn't changed, skip this — layers will continue to load
            instantly from the local cache.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button
            onClick={() => setOpen(false)}
            variant="outlined"
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            variant="contained"
            startIcon={<CachedIcon />}
            sx={{
              bgcolor: '#2e7d32',
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 700,
              '&:hover': { bgcolor: '#1b5e20' },
            }}
          >
            Yes, clear cache &amp; reload
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

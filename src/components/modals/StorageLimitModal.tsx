"use client";

import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';

interface StorageLimitModalProps {
  open: boolean;
  onClose: () => void;
  onCleanup: () => void;
  onUpgrade: () => void;
  spaceNeeded: number;
}

const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const StorageLimitModal: React.FC<StorageLimitModalProps> = ({ open, onClose, onCleanup, onUpgrade, spaceNeeded }) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
    >
      <DialogTitle>
        Storage Limit Reached
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          You don't have enough storage to upload this file.
          {spaceNeeded > 0 && ` You need at least ${formatBytes(spaceNeeded)} more space.`}
          <br/><br/>
          You can either clean up your existing files or upgrade your storage plan.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button 
          onClick={onCleanup}
          variant="outlined"
        >
          Clean Up Storage
        </Button>
        <Button 
          onClick={onUpgrade}
          variant="contained"
          color="primary"
        >
          Upgrade Storage
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StorageLimitModal; 

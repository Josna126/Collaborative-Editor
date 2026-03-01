// Offline mode with sync queue

interface QueuedUpdate {
  id: string;
  documentId: string;
  content: any;
  timestamp: number;
  synced: boolean;
}

const SYNC_QUEUE_KEY = 'offline-sync-queue';

export const offlineSync = {
  // Add update to sync queue
  queueUpdate: (documentId: string, content: any) => {
    try {
      const queue = offlineSync.getQueue();
      const update: QueuedUpdate = {
        id: `update_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        documentId,
        content,
        timestamp: Date.now(),
        synced: false
      };
      queue.push(update);
      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
      return update.id;
    } catch (e) {
      console.error('Failed to queue update:', e);
      return null;
    }
  },

  // Get all queued updates
  getQueue: (): QueuedUpdate[] => {
    try {
      const queueStr = localStorage.getItem(SYNC_QUEUE_KEY);
      return queueStr ? JSON.parse(queueStr) : [];
    } catch {
      return [];
    }
  },

  // Get pending updates for a document
  getPendingUpdates: (documentId: string): QueuedUpdate[] => {
    const queue = offlineSync.getQueue();
    return queue.filter(u => u.documentId === documentId && !u.synced);
  },

  // Mark update as synced
  markSynced: (updateId: string) => {
    try {
      const queue = offlineSync.getQueue();
      const update = queue.find(u => u.id === updateId);
      if (update) {
        update.synced = true;
        localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
      }
    } catch (e) {
      console.error('Failed to mark synced:', e);
    }
  },

  // Clear synced updates older than 24 hours
  cleanupQueue: () => {
    try {
      const queue = offlineSync.getQueue();
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      const cleaned = queue.filter(u => !u.synced || u.timestamp > oneDayAgo);
      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(cleaned));
    } catch (e) {
      console.error('Failed to cleanup queue:', e);
    }
  },

  // Sync all pending updates
  syncPending: async (socket: any, documentId: string) => {
    const pending = offlineSync.getPendingUpdates(documentId);
    
    for (const update of pending) {
      try {
        // Emit update to server
        socket.emit('document-update', {
          documentId: update.documentId,
          content: update.content
        });
        
        // Mark as synced
        offlineSync.markSynced(update.id);
      } catch (e) {
        console.error('Failed to sync update:', e);
      }
    }

    // Cleanup old synced updates
    offlineSync.cleanupQueue();
  },

  // Check if there are pending updates
  hasPendingUpdates: (documentId: string): boolean => {
    return offlineSync.getPendingUpdates(documentId).length > 0;
  },

  // Get count of pending updates
  getPendingCount: (documentId: string): number => {
    return offlineSync.getPendingUpdates(documentId).length;
  }
};

// Online/offline detection
export const connectionMonitor = {
  isOnline: (): boolean => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  },

  onOnline: (callback: () => void) => {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', callback);
    }
  },

  onOffline: (callback: () => void) => {
    if (typeof window !== 'undefined') {
      window.addEventListener('offline', callback);
    }
  },

  removeListeners: (onlineCallback: () => void, offlineCallback: () => void) => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', onlineCallback);
      window.removeEventListener('offline', offlineCallback);
    }
  }
};

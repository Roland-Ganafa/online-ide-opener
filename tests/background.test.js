import { chrome } from 'jest-chrome';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import '../background.js';

describe('Background Service Worker', () => {
  beforeEach(() => {
    // Reset state before each test
    chrome.storage.local.clear();
    chrome.storage.sync.clear();
  });

  describe('IDE Status Checking', () => {
    it('should check IDE status correctly', async () => {
      globalThis.fetch.mockImplementationOnce(() => Promise.resolve({ status: 200 }));
      
      const result = await checkIDEStatus('https://example.com');
      expect(result).toBe(true);
      expect(fetch).toHaveBeenCalledWith('https://example.com', { method: 'HEAD' });
    });

    it('should handle failed IDE status checks', async () => {
      globalThis.fetch.mockImplementationOnce(() => Promise.reject(new Error()));
      
      const result = await checkIDEStatus('https://example.com');
      expect(result).toBe(false);
    });
  });

  describe('Workspace Management', () => {
    it('should save workspace correctly', async () => {
      const tab = {
        id: 1,
        title: 'Test IDE',
        url: 'https://example.com',
        favIconUrl: 'favicon.ico'
      };

      await saveWorkspace(tab);

      expect(chrome.storage.sync.set).toHaveBeenCalled();
      expect(chrome.notifications.create).toHaveBeenCalled();
    });

    it('should merge workspaces without duplicates', () => {
      const local = [
        { id: '1', title: 'Local', lastModified: 100 },
        { id: '2', title: 'Both', lastModified: 200 }
      ];
      
      const remote = [
        { id: '2', title: 'Both', lastModified: 100 },
        { id: '3', title: 'Remote', lastModified: 300 }
      ];

      const merged = mergeWorkspaces(local, remote);
      expect(merged).toHaveLength(3);
      expect(merged.find(w => w.id === '2').lastModified).toBe(200);
    });
  });

  describe('Performance Monitoring', () => {
    it('should detect performance issues', () => {
      const data = {
        loadTime: 6000,
        memoryUsage: 150 * 1024 * 1024,
        networkRequests: 120
      };

      processPerformanceData(data, { id: 1 });

      expect(chrome.notifications.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'basic',
          title: 'Performance Alert'
        })
      );
    });
  });

  describe('Message Handling', () => {
    it('should handle IDE status check messages', () => {
      const sendResponse = jest.fn();
      
      chrome.runtime.onMessage.callListeners(
        { type: 'CHECK_IDE_STATUS', url: 'https://example.com' },
        {},
        sendResponse
      );

      expect(sendResponse).toHaveBeenCalled();
    });

    it('should handle workspace sync messages', () => {
      const sendResponse = jest.fn();
      
      chrome.runtime.onMessage.callListeners(
        { type: 'SYNC_WORKSPACES' },
        {},
        sendResponse
      );

      expect(sendResponse).toHaveBeenCalled();
    });
  });
});

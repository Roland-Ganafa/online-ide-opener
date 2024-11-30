import { jest } from '@jest/globals';

describe('Performance Monitoring', () => {
  let performance;
  let chrome;

  beforeEach(() => {
    // Mock performance API
    performance = {
      memory: {
        usedJSHeapSize: 0,
        totalJSHeapSize: 0
      },
      now: jest.fn()
    };
    global.performance = performance;

    // Mock Chrome API
    chrome = {
      storage: {
        local: {
          get: jest.fn(),
          set: jest.fn()
        }
      }
    };
    global.chrome = chrome;
  });

  describe('Memory Usage', () => {
    test('should detect high memory usage', () => {
      performance.memory.usedJSHeapSize = 900 * 1024 * 1024; // 900MB
      performance.memory.totalJSHeapSize = 1024 * 1024 * 1024; // 1GB
      
      const usage = checkMemoryUsage();
      expect(usage.isHigh).toBeTruthy();
      expect(usage.percentage).toBeGreaterThan(85);
    });

    test('should handle normal memory usage', () => {
      performance.memory.usedJSHeapSize = 100 * 1024 * 1024; // 100MB
      performance.memory.totalJSHeapSize = 1024 * 1024 * 1024; // 1GB
      
      const usage = checkMemoryUsage();
      expect(usage.isHigh).toBeFalsy();
      expect(usage.percentage).toBeLessThan(20);
    });
  });

  describe('Response Time', () => {
    test('should measure operation response time', async () => {
      let time = 0;
      performance.now.mockImplementation(() => time += 100);

      const result = await measureResponseTime(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return 'success';
      });

      expect(result.duration).toBe(100);
      expect(result.value).toBe('success');
    });

    test('should detect slow operations', async () => {
      let time = 0;
      performance.now.mockImplementation(() => time += 500);

      const result = await measureResponseTime(async () => {
        await new Promise(resolve => setTimeout(resolve, 400));
        return 'slow';
      });

      expect(result.isSlow).toBeTruthy();
      expect(result.duration).toBeGreaterThan(300);
    });
  });

  describe('Performance Logging', () => {
    test('should log performance metrics', async () => {
      const metrics = {
        timestamp: Date.now(),
        memoryUsage: 50,
        responseTime: 100
      };

      await logPerformanceMetrics(metrics);
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        performanceLog: expect.arrayContaining([expect.objectContaining(metrics)])
      });
    });

    test('should maintain log size limit', async () => {
      const existingLog = Array(100).fill({ timestamp: Date.now() });
      chrome.storage.local.get.mockImplementation((key, callback) => {
        callback({ performanceLog: existingLog });
      });

      await logPerformanceMetrics({ timestamp: Date.now() });
      
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        performanceLog: expect.arrayContaining([])
      });
      
      const setCall = chrome.storage.local.set.mock.calls[0][0];
      expect(setCall.performanceLog.length).toBeLessThanOrEqual(100);
    });
  });

  describe('Performance Optimization', () => {
    test('should clean up old performance logs', async () => {
      const oldDate = Date.now() - (8 * 24 * 60 * 60 * 1000); // 8 days old
      const recentDate = Date.now() - (2 * 24 * 60 * 60 * 1000); // 2 days old
      
      const logs = [
        { timestamp: oldDate, type: 'old' },
        { timestamp: recentDate, type: 'recent' }
      ];

      chrome.storage.local.get.mockImplementation((key, callback) => {
        callback({ performanceLog: logs });
      });

      await cleanupOldLogs();
      
      const setCall = chrome.storage.local.set.mock.calls[0][0];
      expect(setCall.performanceLog).toHaveLength(1);
      expect(setCall.performanceLog[0].type).toBe('recent');
    });
  });
});

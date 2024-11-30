import { fireEvent } from '@testing-library/dom';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import '../content.js';

describe('Content Script', () => {
  describe('Quick Launch', () => {
    beforeEach(() => {
      document.body.innerHTML = '';
    });

    it('should inject quick launch overlay', () => {
      injectQuickLaunch();
      
      const overlay = document.querySelector('#ide-opener-quick-launch');
      expect(overlay).toBeInTheDocument();
      expect(overlay.querySelector('input')).toBeInTheDocument();
    });

    it('should close quick launch on escape', () => {
      injectQuickLaunch();
      
      const overlay = document.querySelector('#ide-opener-quick-launch');
      fireEvent.keyDown(document, { key: 'Escape' });
      
      expect(overlay).not.toBeInTheDocument();
    });

    it('should search IDEs as user types', async () => {
      injectQuickLaunch();
      
      const input = document.querySelector('#ide-opener-quick-launch input');
      const query = 'vscode';
      
      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        if (message.type === 'SEARCH_IDES') {
          callback({ ides: [
            { name: 'VS Code', url: 'https://vscode.dev', icon: 'vscode.png' }
          ]});
        }
      });

      fireEvent.input(input, { target: { value: query } });
      
      const results = await waitFor(() => 
        document.querySelector('.quick-results')
      );
      
      expect(results.textContent).toContain('VS Code');
    });
  });

  describe('Collaborative Tools', () => {
    it('should inject floating action button', () => {
      injectCollaborativeTools();
      
      const fab = document.querySelector('#ide-opener-fab');
      expect(fab).toBeInTheDocument();
      expect(fab.querySelector('.fab-menu')).toBeInTheDocument();
    });

    it('should toggle menu on click', () => {
      injectCollaborativeTools();
      
      const mainButton = document.querySelector('.fab-main');
      const menu = document.querySelector('.fab-menu');
      
      fireEvent.click(mainButton);
      expect(menu).toHaveClass('active');
      
      fireEvent.click(mainButton);
      expect(menu).not.toHaveClass('active');
    });

    it('should send collaborative actions', () => {
      injectCollaborativeTools();
      
      const shareButton = document.querySelector('[data-action="share"]');
      fireEvent.click(shareButton);
      
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'COLLABORATIVE_ACTION',
        action: 'share'
      });
    });
  });

  describe('Performance Monitoring', () => {
    it('should collect performance metrics', () => {
      const metrics = collectPerformanceMetrics();
      
      expect(metrics).toHaveProperty('loadTime');
      expect(metrics).toHaveProperty('memoryUsage');
      expect(metrics).toHaveProperty('networkRequests');
    });

    it('should send performance data periodically', () => {
      jest.useFakeTimers();
      
      startPerformanceMonitoring();
      jest.advanceTimersByTime(30000);
      
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'PERFORMANCE_DATA',
        data: expect.any(Object)
      });
      
      jest.useRealTimers();
    });
  });

  describe('IDE Compatibility', () => {
    it('should detect GitHub repositories', () => {
      document.title = 'GitHub - Test Repo';
      window.location = new URL('https://github.com/test/repo');
      
      const data = checkIDECompatibility();
      expect(data.isGitHub).toBe(true);
    });

    it('should detect GitLab repositories', () => {
      document.title = 'GitLab - Test Repo';
      window.location = new URL('https://gitlab.com/test/repo');
      
      const data = checkIDECompatibility();
      expect(data.isGitLab).toBe(true);
    });
  });
});

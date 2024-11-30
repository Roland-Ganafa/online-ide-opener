import { jest } from '@jest/globals';

describe('IDE Handler', () => {
  let chrome;
  
  beforeEach(() => {
    // Mock Chrome API
    chrome = {
      storage: {
        sync: {
          get: jest.fn(),
          set: jest.fn()
        }
      },
      runtime: {
        sendMessage: jest.fn(),
        onMessage: {
          addListener: jest.fn()
        }
      }
    };
    global.chrome = chrome;
  });

  describe('IDE Selection', () => {
    test('should correctly parse GitHub repository URL', () => {
      const url = 'https://github.com/user/repo';
      const result = parseGitHubUrl(url);
      expect(result).toEqual({
        owner: 'user',
        repo: 'repo',
        isValid: true
      });
    });

    test('should handle invalid GitHub URLs', () => {
      const url = 'https://example.com/not-github';
      const result = parseGitHubUrl(url);
      expect(result.isValid).toBeFalsy();
    });

    test('should generate correct IDE URLs', () => {
      const repoInfo = {
        owner: 'user',
        repo: 'repo',
        branch: 'main'
      };

      expect(generateGitHubDevUrl(repoInfo))
        .toBe('https://github.dev/user/repo');
      
      expect(generateCodeSandboxUrl(repoInfo))
        .toBe('https://codesandbox.io/s/github/user/repo');
      
      expect(generateStackblitzUrl(repoInfo))
        .toBe('https://stackblitz.com/github/user/repo');
    });
  });

  describe('Settings Management', () => {
    test('should save preferred IDE setting', async () => {
      const settings = { preferredIDE: 'github.dev' };
      chrome.storage.sync.set.mockResolvedValue();
      
      await saveSettings(settings);
      expect(chrome.storage.sync.set).toHaveBeenCalledWith(settings);
    });

    test('should load saved settings', async () => {
      const settings = { preferredIDE: 'github.dev' };
      chrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback(settings);
      });

      const result = await loadSettings();
      expect(result).toEqual(settings);
    });
  });

  describe('Quick Launch', () => {
    test('should filter IDEs based on search term', () => {
      const ides = [
        { name: 'GitHub.dev', id: 'github.dev' },
        { name: 'CodeSandbox', id: 'codesandbox' },
        { name: 'StackBlitz', id: 'stackblitz' }
      ];
      
      const results = filterIDEs(ides, 'code');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('codesandbox');
    });

    test('should handle empty search term', () => {
      const ides = [
        { name: 'GitHub.dev', id: 'github.dev' },
        { name: 'CodeSandbox', id: 'codesandbox' }
      ];
      
      const results = filterIDEs(ides, '');
      expect(results).toEqual(ides);
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      chrome.runtime.sendMessage.mockRejectedValue(new Error('Network error'));
      
      await expect(openRepository('https://github.com/user/repo'))
        .rejects
        .toThrow('Failed to open repository');
    });

    test('should validate repository URL', () => {
      expect(isValidRepositoryUrl('https://github.com/user/repo')).toBeTruthy();
      expect(isValidRepositoryUrl('not-a-url')).toBeFalsy();
    });
  });
});

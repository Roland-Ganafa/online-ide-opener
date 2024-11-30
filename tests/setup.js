// Jest setup file
import '@testing-library/jest-dom';
import { chrome } from 'jest-chrome';
import { jest } from '@jest/globals';

// Mock chrome API
globalThis.chrome = chrome;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn()
};
globalThis.localStorage = localStorageMock;

// Mock clipboard API
const clipboardMock = {
  writeText: jest.fn()
};
globalThis.navigator.clipboard = clipboardMock;

// Mock notifications
globalThis.Notification = {
  requestPermission: jest.fn(),
  permission: 'granted'
};

// Mock fetch
globalThis.fetch = jest.fn();

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  document.body.innerHTML = '';
});

import '@testing-library/jest-dom';

// Mock Chrome APIs
Object.assign(global, {
  chrome: {
    runtime: {
      sendMessage: vi.fn(),
      onMessage: {
        addListener: vi.fn(),
      },
    },
    storage: {
      sync: {
        get: vi.fn(),
        set: vi.fn(),
      },
    },
    tabs: {
      query: vi.fn(),
    },
    scripting: {
      executeScript: vi.fn(),
    },
  },
});

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'https://example.com',
    hostname: 'example.com',
  },
  writable: true,
});

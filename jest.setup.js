// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock react-hot-toast to avoid portal rendering issues in jsdom
jest.mock('react-hot-toast', () => {
  const mockToast = Object.assign(
    jest.fn(),
    {
      success: jest.fn(),
      error: jest.fn(),
      loading: jest.fn(),
      custom: jest.fn(),
      promise: jest.fn(),
      dismiss: jest.fn(),
    }
  );
  return {
    __esModule: true,
    default: mockToast,
  };
})

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ShareAchievementButton from '../ShareAchievementButton';
import toast from 'react-hot-toast';

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock window.open
global.window.open = jest.fn();

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = jest.fn();

describe('ShareAchievementButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.clear();
    mockLocalStorage.setItem('clerk_token', 'mock-token');
    // Ensure NEXT_PUBLIC_API_URL is not set so component uses default
    delete process.env.NEXT_PUBLIC_API_URL;
  });

  it('should render share button', () => {
    render(
      <ShareAchievementButton
        achievementId="achievement-123"
        achievementName="First Bet"
      />
    );

    const button = screen.getByTitle('Share achievement');
    expect(button).toBeInTheDocument();
  });

  it('should open modal when share button is clicked', () => {
    render(
      <ShareAchievementButton
        achievementId="achievement-123"
        achievementName="First Bet"
      />
    );

    const shareButton = screen.getByTitle('Share achievement');
    fireEvent.click(shareButton);

    expect(screen.getByText('Share Achievement')).toBeInTheDocument();
    expect(
      screen.getByText(/Share your "First Bet" achievement/),
    ).toBeInTheDocument();
  });

  it('should close modal when X button is clicked', () => {
    render(
      <ShareAchievementButton
        achievementId="achievement-123"
        achievementName="First Bet"
      />
    );

    // Open modal
    const shareButton = screen.getByTitle('Share achievement');
    fireEvent.click(shareButton);

    // Modal should be visible
    expect(screen.getByText('Share Achievement')).toBeInTheDocument();

    // Close modal - get all buttons and find the close button (second button after modal opens)
    const buttons = screen.getAllByRole('button');
    const closeButton = buttons[1]; // First is share button, second is close button
    fireEvent.click(closeButton);

    expect(screen.queryByText('Share Achievement')).not.toBeInTheDocument();
  });

  it('should download image when Download button is clicked', async () => {
    const mockBlob = new Blob(['image data'], { type: 'image/png' });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
    });

    // Mock createElement only for 'a' elements to capture link click
    const mockLink: Partial<HTMLAnchorElement> = {
      href: '',
      download: '',
      click: jest.fn(),
      setAttribute: jest.fn(),
      style: {},
    };
    const originalCreateElement = document.createElement.bind(document);
    jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'a') {
        return mockLink as HTMLAnchorElement;
      }
      return originalCreateElement(tagName);
    });

    render(
      <ShareAchievementButton
        achievementId="achievement-123"
        achievementName="First Bet"
      />
    );

    // Open modal
    const shareButton = screen.getByTitle('Share achievement');
    fireEvent.click(shareButton);

    // Click download button
    const downloadButton = screen.getByText(/Download Image/i);
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/share/achievement/achievement-123',
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer mock-token',
          },
        }),
      );
    });

    await waitFor(() => {
      expect(mockLink.click).toHaveBeenCalled();
      expect(mockLink.download).toContain('achievement-first-bet.png');
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Image downloaded!');
    });
  });

  it('should show error toast if download fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
    });

    render(
      <ShareAchievementButton
        achievementId="achievement-123"
        achievementName="First Bet"
      />
    );

    const shareButton = screen.getByTitle('Share achievement');
    fireEvent.click(shareButton);

    const downloadButton = screen.getByText(/Download Image/i);
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Failed to generate share image',
      );
    });
  });

  it('should open Twitter share when Twitter button is clicked', async () => {
    const mockBlob = new Blob(['image data'], { type: 'image/png' });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
    });

    render(
      <ShareAchievementButton
        achievementId="achievement-123"
        achievementName="First Bet"
      />
    );

    const shareButton = screen.getByTitle('Share achievement');
    fireEvent.click(shareButton);

    const twitterButton = screen.getByText(/Share on Twitter/i);
    fireEvent.click(twitterButton);

    await waitFor(() => {
      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining('twitter.com/intent/tweet'),
        '_blank',
        'width=600,height=400',
      );
    });
  });

  it('should open Facebook share when Facebook button is clicked', async () => {
    const mockBlob = new Blob(['image data'], { type: 'image/png' });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
    });

    render(
      <ShareAchievementButton
        achievementId="achievement-123"
        achievementName="First Bet"
      />
    );

    const shareButton = screen.getByTitle('Share achievement');
    fireEvent.click(shareButton);

    const facebookButton = screen.getByText(/Share on Facebook/i);
    fireEvent.click(facebookButton);

    await waitFor(() => {
      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining('facebook.com/sharer'),
        '_blank',
        'width=600,height=400',
      );
    });
  });

  it('should open LinkedIn share when LinkedIn button is clicked', async () => {
    const mockBlob = new Blob(['image data'], { type: 'image/png' });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
    });

    render(
      <ShareAchievementButton
        achievementId="achievement-123"
        achievementName="First Bet"
      />
    );

    const shareButton = screen.getByTitle('Share achievement');
    fireEvent.click(shareButton);

    const linkedinButton = screen.getByText(/Share on LinkedIn/i);
    fireEvent.click(linkedinButton);

    await waitFor(() => {
      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining('linkedin.com/sharing'),
        '_blank',
        'width=600,height=400',
      );
    });
  });

  it('should disable buttons while generating', async () => {
    (global.fetch as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ ok: true, blob: () => new Blob() }), 1000),
        ),
    );

    render(
      <ShareAchievementButton
        achievementId="achievement-123"
        achievementName="First Bet"
      />
    );

    const shareButton = screen.getByTitle('Share achievement');
    fireEvent.click(shareButton);

    const downloadButton = screen.getByText(/Download Image/i);
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(screen.getByText(/Generating.../i)).toBeInTheDocument();
    });

    // All buttons should be disabled
    const buttons = screen.getAllByRole('button');
    const disabledButtons = buttons.filter((btn) => btn.hasAttribute('disabled'));
    expect(disabledButtons.length).toBeGreaterThan(0);
  });

  it('should handle achievement names with special characters', () => {
    render(
      <ShareAchievementButton
        achievementId="achievement-123"
        achievementName="First™ Bet® 🎯"
      />
    );

    const shareButton = screen.getByTitle('Share achievement');
    fireEvent.click(shareButton);

    expect(
      screen.getByText(/Share your "First™ Bet® 🎯" achievement/),
    ).toBeInTheDocument();
  });

  it('should use correct API URL from environment variable', async () => {
    const mockBlob = new Blob(['image data'], { type: 'image/png' });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
    });

    // Mock environment variable
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com/api';

    render(
      <ShareAchievementButton
        achievementId="achievement-123"
        achievementName="First Bet"
      />
    );

    const shareButton = screen.getByTitle('Share achievement');
    fireEvent.click(shareButton);

    const downloadButton = screen.getByText(/Download Image/i);
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('api.example.com'),
        expect.any(Object),
      );
    });

    // Clean up
    delete process.env.NEXT_PUBLIC_API_URL;
  });
});

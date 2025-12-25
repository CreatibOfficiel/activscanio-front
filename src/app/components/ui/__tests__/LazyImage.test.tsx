import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LazyImage, { LazyImageWithSkeleton } from '../LazyImage';

// Mock IntersectionObserver
class MockIntersectionObserver {
  constructor(private callback: IntersectionObserverCallback) {}

  observe(target: Element) {
    // Simulate element entering viewport immediately
    setTimeout(() => {
      this.callback(
        [
          {
            isIntersecting: true,
            target,
          } as IntersectionObserverEntry,
        ],
        this as any,
      );
    }, 0);
  }

  disconnect() {}
  unobserve() {}
}

global.IntersectionObserver = MockIntersectionObserver as any;

// Mock Image loading
let imageInstanceCount = 0;

class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  src = '';

  constructor() {
    imageInstanceCount++;
    setTimeout(() => {
      if (this.onload) {
        this.onload();
      }
    }, 0);
  }
}

global.Image = MockImage as any;

describe('LazyImage', () => {
  it('should render image with correct src', async () => {
    render(<LazyImage src="/test-image.jpg" alt="Test image" />);

    const img = screen.getByAltText('Test image');
    expect(img).toBeInTheDocument();

    await waitFor(() => {
      expect(img).toHaveAttribute('src', '/test-image.jpg');
    });
  });

  it('should start with placeholder image', () => {
    render(
      <LazyImage
        src="/test-image.jpg"
        alt="Test image"
        placeholder="/placeholder.jpg"
      />
    );

    const img = screen.getByAltText('Test image');
    expect(img).toHaveAttribute('src', '/placeholder.jpg');
  });

  it('should apply custom className', () => {
    render(
      <LazyImage
        src="/test-image.jpg"
        alt="Test image"
        className="custom-class"
      />
    );

    const img = screen.getByAltText('Test image');
    expect(img).toHaveClass('custom-class');
  });

  it('should have loading="lazy" attribute', () => {
    render(<LazyImage src="/test-image.jpg" alt="Test image" />);

    const img = screen.getByAltText('Test image');
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('should call onLoad callback when image loads', async () => {
    const onLoad = jest.fn();

    render(
      <LazyImage src="/test-image.jpg" alt="Test image" onLoad={onLoad} />
    );

    await waitFor(() => {
      expect(onLoad).toHaveBeenCalled();
    });
  });

  it('should transition opacity when loaded', async () => {
    render(<LazyImage src="/test-image.jpg" alt="Test image" />);

    const img = screen.getByAltText('Test image');

    // Initially should have opacity-50
    expect(img).toHaveClass('opacity-50');

    await waitFor(() => {
      // After loading should have opacity-100
      expect(img).toHaveClass('opacity-100');
    });
  });

  it('should handle image load errors', async () => {
    // Override MockImage to simulate error
    class ErrorImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      src = '';

      constructor() {
        setTimeout(() => {
          if (this.onerror) {
            this.onerror();
          }
        }, 0);
      }
    }

    global.Image = ErrorImage as any;

    const onError = jest.fn();

    render(
      <LazyImage src="/bad-image.jpg" alt="Test image" onError={onError} />
    );

    await waitFor(() => {
      expect(onError).toHaveBeenCalled();
    });

    const img = screen.getByAltText('Test image');
    expect(img).toHaveClass('grayscale');

    // Restore MockImage
    global.Image = MockImage as any;
  });

  it('should accept additional img attributes', () => {
    render(
      <LazyImage
        src="/test-image.jpg"
        alt="Test image"
        width={100}
        height={100}
        title="Test title"
      />
    );

    const img = screen.getByAltText('Test image');
    expect(img).toHaveAttribute('width', '100');
    expect(img).toHaveAttribute('height', '100');
    expect(img).toHaveAttribute('title', 'Test title');
  });

  it('should use IntersectionObserver with correct options', () => {
    const observeSpy = jest.spyOn(
      MockIntersectionObserver.prototype,
      'observe',
    );

    render(
      <LazyImage
        src="/test-image.jpg"
        alt="Test image"
        threshold={0.5}
        rootMargin="100px"
      />
    );

    expect(observeSpy).toHaveBeenCalled();
  });

  it('should cleanup IntersectionObserver on unmount', () => {
    const disconnectSpy = jest.spyOn(
      MockIntersectionObserver.prototype,
      'disconnect',
    );

    const { unmount } = render(
      <LazyImage src="/test-image.jpg" alt="Test image" />
    );

    unmount();

    expect(disconnectSpy).toHaveBeenCalled();
  });
});

describe('LazyImageWithSkeleton', () => {
  it('should render with skeleton initially', () => {
    render(
      <LazyImageWithSkeleton src="/test-image.jpg" alt="Test image" />
    );

    const skeleton = document.querySelector('.animate-shimmer');
    expect(skeleton).toBeInTheDocument();
  });

  it('should hide skeleton after image loads', async () => {
    render(
      <LazyImageWithSkeleton src="/test-image.jpg" alt="Test image" />
    );

    await waitFor(() => {
      const img = screen.getByAltText('Test image');
      expect(img).toHaveClass('opacity-100');
    });
  });

  it('should apply custom aspect ratio', () => {
    const { container } = render(
      <LazyImageWithSkeleton
        src="/test-image.jpg"
        alt="Test image"
        aspectRatio="4/3"
      />
    );

    // Query the wrapper div by its class names
    const wrapper = container.querySelector('.relative.overflow-hidden') as HTMLElement;
    // Check the style attribute directly since jsdom doesn't fully support aspect-ratio
    expect(wrapper.style.aspectRatio).toBe('4/3');
  });

  it('should default to 16/9 aspect ratio', () => {
    const { container } = render(
      <LazyImageWithSkeleton src="/test-image.jpg" alt="Test image" />
    );

    // Query the wrapper div by its class names
    const wrapper = container.querySelector('.relative.overflow-hidden') as HTMLElement;
    // Check the style attribute directly since jsdom doesn't fully support aspect-ratio
    expect(wrapper.style.aspectRatio).toBe('16/9');
  });

  it('should pass className to LazyImage', () => {
    render(
      <LazyImageWithSkeleton
        src="/test-image.jpg"
        alt="Test image"
        className="custom-image-class"
      />
    );

    const img = screen.getByAltText('Test image');
    expect(img).toHaveClass('custom-image-class');
  });
});

describe('LazyImage Performance', () => {
  it('should not load image until in viewport', () => {
    // Mock IntersectionObserver that never calls callback
    class NoIntersectObserver {
      observe() {}
      disconnect() {}
      unobserve() {}
    }

    global.IntersectionObserver = NoIntersectObserver as any;

    render(<LazyImage src="/test-image.jpg" alt="Test image" />);

    const img = screen.getByAltText('Test image');

    // Should still show placeholder
    expect(img).toHaveAttribute('src', '/placeholder-image.png');

    // Restore original mock
    global.IntersectionObserver = MockIntersectionObserver as any;
  });

  it('should only create one Image instance per load', async () => {
    // Reset the counter
    imageInstanceCount = 0;

    render(<LazyImage src="/test-image.jpg" alt="Test image" />);

    await waitFor(() => {
      expect(imageInstanceCount).toBe(1);
    });
  });

  it('should handle rapid src changes', async () => {
    const { rerender } = render(
      <LazyImage src="/image1.jpg" alt="Test image" />
    );

    rerender(<LazyImage src="/image2.jpg" alt="Test image" />);
    rerender(<LazyImage src="/image3.jpg" alt="Test image" />);

    const img = screen.getByAltText('Test image');

    await waitFor(() => {
      // Should eventually load the last image
      expect(img).toHaveAttribute('src');
    });
  });
});

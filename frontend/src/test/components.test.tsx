import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '../components/Header';
import { UploadArea } from '../components/UploadArea';
import { ErrorMessage } from '../components/ErrorMessage';
import { ProcessingIndicator } from '../components/ProcessingIndicator';
import { DownloadButton } from '../components/DownloadButton';
import { BeforeAfterSlider } from '../components/BeforeAfterSlider';
import type { ImageFileMeta, ProcessedResult } from '../types';

describe('Header component', () => {
  it('renders ClearCut AI brand, navigation, and model ready status', () => {
    const handlePrivacy = vi.fn();
    render(
      <Header
        health={{
          status: 'ok',
          model_ready: true,
          model_name: 'u2net',
          version: '1.0.0',
        }}
        onOpenPrivacy={handlePrivacy}
      />
    );

    expect(screen.getByText(/ClearCut/i)).toBeInTheDocument();
    expect(screen.getByText(/Free Tool/i)).toBeInTheDocument();
    expect(screen.getByText(/Model Ready/i)).toBeInTheDocument();

    const privacyBtn = screen.getByText(/100% Private/i);
    fireEvent.click(privacyBtn);
    expect(handlePrivacy).toHaveBeenCalledTimes(1);
  });
});

describe('UploadArea component', () => {
  it('renders upload area, drop zone, and sample preset buttons', () => {
    const onSelect = vi.fn();
    const onError = vi.fn();

    render(<UploadArea onImageSelected={onSelect} onError={onError} />);

    expect(screen.getByText(/Choose an image or drag it here/i)).toBeInTheDocument();
    expect(screen.getByText(/Upload Image/i)).toBeInTheDocument();
    expect(screen.getByText(/Portrait \(Person\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Product \(Shoe\)/i)).toBeInTheDocument();
  });
});

describe('ErrorMessage component', () => {
  it('renders error message, retry button, and dismiss action', () => {
    const onRetry = vi.fn();
    const onDismiss = vi.fn();

    render(
      <ErrorMessage
        message="Test network failure error"
        onRetry={onRetry}
        onDismiss={onDismiss}
      />
    );

    expect(screen.getByText(/Unable to process image/i)).toBeInTheDocument();
    expect(screen.getByText(/Test network failure error/i)).toBeInTheDocument();

    const retryBtn = screen.getByText(/Try Again/i);
    fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalledTimes(1);

    const dismissBtn = screen.getByLabelText(/Dismiss error message/i);
    fireEvent.click(dismissBtn);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});

describe('ProcessingIndicator component', () => {
  it('displays processing state and allows cancellation', () => {
    const onCancel = vi.fn();

    render(
      <ProcessingIndicator
        status="processing"
        progressPercent={100}
        onCancel={onCancel}
        imageName="portrait.jpg"
      />
    );

    expect(screen.getByText(/Removing background\.\.\./i)).toBeInTheDocument();
    const cancelBtn = screen.getByText(/Cancel Processing/i);
    fireEvent.click(cancelBtn);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

describe('DownloadButton component', () => {
  it('renders download PNG button and process another image button', () => {
    const onReset = vi.fn();
    const dummyOriginal: ImageFileMeta = {
      file: new File([''], 'photo.jpg', { type: 'image/jpeg' }),
      name: 'photo.jpg',
      size: 1024,
      width: 400,
      height: 400,
      format: 'JPEG',
      originalUrl: 'blob:http://localhost/dummy-orig',
    };
    const dummyResult: ProcessedResult = {
      blob: new Blob([''], { type: 'image/png' }),
      url: 'blob:http://localhost/dummy-res',
      width: 400,
      height: 400,
    };

    render(
      <DownloadButton
        original={dummyOriginal}
        result={dummyResult}
        onReset={onReset}
      />
    );

    expect(screen.getByText(/Download PNG \(Transparent\)/i)).toBeInTheDocument();
    const resetBtn = screen.getByText(/Process Another Image/i);
    fireEvent.click(resetBtn);
    expect(onReset).toHaveBeenCalledTimes(1);
  });
});

describe('BeforeAfterSlider component', () => {
  it('renders slider element with accessibility attributes', () => {
    render(
      <BeforeAfterSlider
        originalUrl="blob:http://localhost/orig"
        processedUrl="blob:http://localhost/proc"
      />
    );

    const slider = screen.getByRole('slider');
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveAttribute('aria-valuenow', '50');
  });
});

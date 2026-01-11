// Mock the API module
vi.mock('../lib/api', () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

// Mock base64 decoder
vi.mock('../lib/base64-decoder', () => ({
  decodeBase64Csv: vi.fn(),
  parseCsvMetadata: vi.fn(),
  validateCsvMetadata: vi.fn(),
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import toast from 'react-hot-toast';
import Home from './page';
import { apiClient } from '../lib/api';
import { decodeBase64Csv, parseCsvMetadata, validateCsvMetadata } from '../lib/base64-decoder';

const mockApiClient = vi.mocked(apiClient);
const mockDecodeBase64Csv = vi.mocked(decodeBase64Csv);
const mockParseCsvMetadata = vi.mocked(parseCsvMetadata);
const mockValidateCsvMetadata = vi.mocked(validateCsvMetadata);
const mockToast = vi.mocked(toast);

describe('Home Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear localStorage for nonce tracking
    localStorage.clear();
  });

  describe('Initial State', () => {
    it('renders page title and description', () => {
      render(<Home />);

      expect(screen.getByText('AI Ticket Classifier')).toBeInTheDocument();
      expect(screen.getByText('Automated support ticket organization')).toBeInTheDocument();
    });

    it('shows generate button initially', () => {
      render(<Home />);

      const generateButton = screen.getByRole('button', { name: /generate sample tickets/i });
      expect(generateButton).toBeInTheDocument();
    });

    it('has correct footer links', () => {
      render(<Home />);

      const backendLink = screen.getByRole('link', { name: /backend api/i });
      const frontendLink = screen.getByRole('link', { name: /frontend react/i });

      expect(backendLink).toHaveAttribute('href', 'https://github.com/leandrodsg/ai-ticket-classifier-api');
      expect(frontendLink).toHaveAttribute('href', 'https://github.com/leandrodsg/ai-ticket-classifier-web');
    });
  });

  describe('Processing State', () => {
    beforeEach(() => {
      mockParseCsvMetadata.mockReturnValue({
        version: 'v1',
        signature: 'sig',
        timestamp: '2026-01-11T20:00:00Z',
        session_id: 'session',
        row_count: 15,
        nonce: 'nonce12345678901234567890123456789012',
        expires_at: '2026-01-11T21:00:00Z',
      });
      mockValidateCsvMetadata.mockImplementation(() => {});
    });

    it('shows progress bar and text when generating', async () => {
      mockApiClient.post
        .mockResolvedValueOnce({ data: { data: { csv_content: 'base64data' } } })
        .mockResolvedValueOnce({ data: { success: true } });
      mockDecodeBase64Csv.mockReturnValue('decoded,csv,data');

      render(<Home />);

      const generateButton = screen.getByRole('button', { name: /generate sample tickets/i });
      fireEvent.click(generateButton);

      // Check that some progress message appears during processing
      expect(screen.getByText(/Initializing AI magic|Consulting the ticket gods|Decoding ancient CSV runes|Teaching AI to classify tickets|AI enlightenment achieved/)).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Sample dataset ready!')).toBeInTheDocument();
      });
    });

    it('calls API endpoints in correct order', async () => {
      const mockCsvResponse = { data: { data: { csv_content: 'base64csvdata' } } };
      const mockClassifyResponse = { data: { success: true } };
      const mockDecodedCsv = 'ticket_id,subject\n1,test';

      mockApiClient.post
        .mockResolvedValueOnce(mockCsvResponse)
        .mockResolvedValueOnce(mockClassifyResponse);
      mockDecodeBase64Csv.mockReturnValue(mockDecodedCsv);

      render(<Home />);

      const generateButton = screen.getByRole('button', { name: /generate sample tickets/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(mockApiClient.post).toHaveBeenCalledWith('/csv/generate', { ticket_count: 15 });
        expect(mockDecodeBase64Csv).toHaveBeenCalledWith('base64csvdata');
        expect(mockParseCsvMetadata).toHaveBeenCalledWith(mockDecodedCsv);
        expect(mockValidateCsvMetadata).toHaveBeenCalled();
        expect(mockApiClient.post).toHaveBeenCalledWith('/tickets/upload', { csv_content: 'base64csvdata' });
      });
    });

    it('updates progress correctly', async () => {
      mockApiClient.post
        .mockResolvedValueOnce({ data: { data: { csv_content: 'base64data' } } })
        .mockResolvedValueOnce({ data: { success: true } });
      mockDecodeBase64Csv.mockReturnValue('decoded,csv');

      render(<Home />);

      const generateButton = screen.getByRole('button', { name: /generate.*sample ticket/i });
      fireEvent.click(generateButton);

      // Check that progress bar appears during processing
      await waitFor(() => {
        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toBeInTheDocument();
      });

      // Wait for completion
      await waitFor(() => {
        expect(screen.getByText('Sample dataset ready!')).toBeInTheDocument();
      });
    });
  });

  describe('Complete State', () => {
    beforeEach(() => {
      mockParseCsvMetadata.mockReturnValue({
        version: 'v1',
        signature: 'sig',
        timestamp: '2026-01-11T20:00:00Z',
        session_id: 'session',
        row_count: 15,
        nonce: 'nonce12345678901234567890123456789012',
        expires_at: '2026-01-11T21:00:00Z',
      });
      mockValidateCsvMetadata.mockImplementation(() => {});
    });

    it('shows success message and open dashboard button after completion', async () => {
      mockApiClient.post
        .mockResolvedValueOnce({ data: { data: { csv_content: 'base64data' } } })
        .mockResolvedValueOnce({ data: { success: true } });
      mockDecodeBase64Csv.mockReturnValue('decoded,csv');

      render(<Home />);

      const generateButton = screen.getByRole('button', { name: /generate sample tickets/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('Sample dataset ready!')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /open dashboard/i })).toBeInTheDocument();
      });
    });

    it('navigates to dashboard when open dashboard is clicked', async () => {
      mockApiClient.post
        .mockResolvedValueOnce({ data: { data: { csv_content: 'base64data' } } })
        .mockResolvedValueOnce({ data: { success: true } });
      mockDecodeBase64Csv.mockReturnValue('decoded,csv');

      render(<Home />);

      // Complete the flow
      const generateButton = screen.getByRole('button', { name: /generate sample tickets/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('Sample dataset ready!')).toBeInTheDocument();
      });

      // Click open dashboard
      const openDashboardButton = screen.getByRole('button', { name: /open dashboard/i });
      fireEvent.click(openDashboardButton);

      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('Error Handling', () => {
    it('shows error toast on API error', async () => {
      const apiError = new Error('API Error');
      mockApiClient.post.mockRejectedValueOnce(apiError);

      render(<Home />);

      const generateButton = screen.getByRole('button', { name: /generate.*sample ticket/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          expect.stringContaining('Error'),
          expect.any(Object)
        );
      });
    });

    it('resets to initial state on API error', async () => {
      mockApiClient.post.mockRejectedValueOnce(new Error('API Error'));

      render(<Home />);

      const generateButton = screen.getByRole('button', { name: /generate.*sample ticket/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /generate.*sample ticket/i })).toBeInTheDocument();
      });
    });

    it('shows specific error message for timeout', async () => {
      const timeoutError = { code: 'ECONNABORTED' };
      mockApiClient.post.mockRejectedValueOnce(timeoutError);

      render(<Home />);

      const generateButton = screen.getByRole('button', { name: /generate.*sample ticket/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          expect.stringContaining('timeout'),
          expect.any(Object)
        );
      });
    });

    it('shows specific error message for network error', async () => {
      const networkError = { code: 'ERR_NETWORK' };
      mockApiClient.post.mockRejectedValueOnce(networkError);

      render(<Home />);

      const generateButton = screen.getByRole('button', { name: /generate.*sample ticket/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          expect.stringContaining('Network error'),
          expect.any(Object)
        );
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for progress bar', async () => {
      mockApiClient.post
        .mockResolvedValueOnce({ data: { data: { csv_content: 'base64data' } } })
        .mockResolvedValueOnce({ data: { success: true } });
      mockDecodeBase64Csv.mockReturnValue('decoded,csv');

      render(<Home />);

      const generateButton = screen.getByRole('button', { name: /generate.*sample ticket/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toBeInTheDocument();
        expect(progressBar).toHaveAttribute('aria-valuenow');
        expect(progressBar).toHaveAttribute('aria-valuemin', '0');
        expect(progressBar).toHaveAttribute('aria-valuemax', '100');
      });
    });

    it('supports keyboard navigation', () => {
      render(<Home />);

      const generateButton = screen.getByRole('button', { name: /generate.*sample ticket/i });
      generateButton.focus();
      expect(document.activeElement).toBe(generateButton);
    });
  });
});
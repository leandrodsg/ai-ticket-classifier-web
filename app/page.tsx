'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { apiClient } from '../lib/api';
import { decodeBase64Csv, parseCsvMetadata, validateCsvMetadata } from '../lib/base64-decoder';

type State = 'initial' | 'processing' | 'complete';

export default function Home() {
  const [state, setState] = useState<State>('initial');
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const router = useRouter();

  const handleGenerate = async () => {
    const ticketCount = 15; // Fixed number of sample tickets
    setState('processing');
    setProgress(0);
    setProgressMessage('Initializing AI magic...');

    try {
      // Step 1: Call POST /api/csv/generate (25%)
      setProgress(25);
      setProgressMessage('Consulting the ticket gods...');
      const csvResponse = await apiClient.post('/csv/generate', {
        ticket_count: ticketCount
      });

      console.log('CSV Generation Response:', {
        status: csvResponse.status,
        hasData: !!csvResponse.data,
        hasCsvContent: !!csvResponse.data?.data?.csv_content,
        csvContentLength: csvResponse.data?.data?.csv_content?.length
      });
      console.log('Full CSV Response Data:', JSON.stringify(csvResponse.data, null, 2));

      // Step 2: Decode base64 CSV (50%)
      setProgress(50);
      setProgressMessage('Decoding ancient CSV runes...');
      const decodedCsv = decodeBase64Csv(csvResponse.data.data.csv_content);
      console.log('Decoded CSV preview (first 500 chars):', decodedCsv.substring(0, 500));
      console.log('Decoded CSV length:', decodedCsv.length);

      // Step 2.5: Parse and validate CSV metadata (security layer)
      setProgress(60);
      setProgressMessage('Validating CSV security metadata...');
      const metadata = parseCsvMetadata(decodedCsv);
      validateCsvMetadata(metadata);
      console.log('CSV Metadata validated:', {
        session_id: metadata.session_id,
        expires_at: metadata.expires_at,
        row_count: metadata.row_count,
        nonce: metadata.nonce.substring(0, 8) + '...' // Log partial nonce for security
      });

      // Store used nonce to prevent accidental reuse (local storage)
      const usedNonces = JSON.parse(localStorage.getItem('used_nonces') || '[]');
      if (usedNonces.includes(metadata.nonce)) {
        throw new Error('This CSV nonce has already been used. Please generate a new CSV.');
      }
      usedNonces.push(metadata.nonce);
      localStorage.setItem('used_nonces', JSON.stringify(usedNonces.slice(-10))); // Keep last 10

      // Step 3: Call POST /api/tickets/upload with base64 CSV (75%)
      setProgress(75);
      
      // Dynamic message based on ticket count
      const estimatedTime = '2-4min'; // Estimated for 15 tickets with concurrent processing
      setProgressMessage(`Teaching AI to classify 15 sample tickets... (~${estimatedTime})`);
      
      const uploadPayload = { 
        csv_content: csvResponse.data.data.csv_content 
      };
      
      console.log('Sending to /tickets/upload:', {
        endpoint: '/tickets/upload',
        payloadKeys: Object.keys(uploadPayload),
        csvContentLength: csvResponse.data.data.csv_content.length,
        csvContentPreview: csvResponse.data.data.csv_content.substring(0, 100),
        timestamp: new Date().toISOString()
      });

      const uploadResponse = await apiClient.post('/tickets/upload', uploadPayload);

      console.log('Upload Response:', {
        status: uploadResponse.status,
        data: uploadResponse.data
      });
      console.log('Full Upload Response:', JSON.stringify(uploadResponse.data, null, 2));

      // Complete (100%)
      setProgress(100);
      setProgressMessage('AI enlightenment achieved!');

      // Show success toast
      toast.success('Sample dataset ready! 🎉', {
        duration: 3000,
      });

      // Complete
      setState('complete');
    } catch (error: any) {
      // Log full error object first
      console.error('Full error object:', error);
      console.error('Error type:', typeof error);
      console.error('Error constructor:', error?.constructor?.name);
      
      // Log detailed breakdown
      console.error('Error details:', {
        message: error?.message || 'No message',
        code: error?.code || 'No code',
        name: error?.name || 'No name',
        status: error?.response?.status || 'No status',
        statusText: error?.response?.statusText || 'No status text',
        data: error?.response?.data || 'No response data',
        headers: error?.response?.headers || 'No headers',
        config: error?.config ? {
          url: error.config.url,
          method: error.config.method,
          baseURL: error.config.baseURL,
          timeout: error.config.timeout,
          data: error.config.data
        } : 'No config',
        stack: error?.stack || 'No stack trace'
      });

      
      // Log backend error message specifically for 422
      if (error?.response?.status === 422) {
        console.error('🔴 Backend Validation Error (422):', JSON.stringify(error.response.data, null, 2));
        console.error('Request that failed:', JSON.stringify(error.config?.data, null, 2));
      }
      // Show user-friendly error
      let errorMsg = 'An unexpected error occurred';
      
      if (error?.code === 'ECONNABORTED') {
        errorMsg = `Request timeout - AI processing took more than 5 minutes.\n\n💡 The backend may be overloaded or not responding. Please check the backend logs.`;
      } else if (error?.code === 'ERR_NETWORK') {
        errorMsg = 'Network error - Please check if the backend API is running';
      } else if (error?.response?.data?.message) {
        const backendMsg = error.response.data.message.toLowerCase();
        if (backendMsg.includes('hmac') || backendMsg.includes('signature')) {
          errorMsg = 'Security validation failed: CSV signature is invalid. The CSV may have been tampered with.';
        } else if (backendMsg.includes('nonce')) {
          errorMsg = 'Security validation failed: Nonce has already been used or is invalid. Please generate a new CSV.';
        } else if (backendMsg.includes('expired')) {
          errorMsg = 'CSV has expired. Please generate a new one.';
        } else {
          errorMsg = error.response.data.message;
        }
      } else if (error?.message) {
        errorMsg = error.message;
      } else if (typeof error === 'string') {
        errorMsg = error;
      }
      
      toast.error(`Error: ${errorMsg}`, {
        duration: 5000,
        style: {
          maxWidth: '500px',
        },
      });
      
      setState('initial');
      setProgress(0);
      setProgressMessage('');
    }
  };

  const handleOpenDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <div className="flex flex-col min-h-screen bg-[var(--background)]">
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-4xl font-bold mb-2 text-[var(--foreground)]">
            AI Ticket Classifier
          </h1>
          <p className="text-lg mb-8 text-[var(--foreground)]">
            Automated support ticket organization
          </p>

          {state === 'initial' && (
            <div>
              <button
                onClick={handleGenerate}
                className="bg-[var(--accent)] text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition w-full"
              >
                Generate Sample Tickets
              </button>
            </div>
          )}

          {state === 'processing' && (
            <div>
              <div
                className="w-full bg-gray-200 rounded-full h-4 mb-4"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="bg-[var(--accent)] h-4 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-[var(--foreground)]">{progressMessage}</p>
            </div>
          )}

          {state === 'complete' && (
            <div>
              <p className="text-[var(--success)] font-medium mb-4">
                Sample dataset ready!
              </p>
              <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
                <div className="bg-[var(--success)] h-4 rounded-full w-full"></div>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleOpenDashboard}
                  className="bg-[var(--accent)] text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition w-full"
                >
                  Open Dashboard
                </button>
                <button
                  onClick={() => {
                    setState('initial');
                    setProgress(0);
                    setProgressMessage('');
                  }}
                  className="bg-gray-200 text-[var(--foreground)] px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition w-full"
                >
                  Generate Another
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="bg-[var(--accent)] text-white py-4">
        <div className="flex justify-center gap-8">
          <a
            href="https://github.com/leandrodsg/ai-ticket-classifier-api"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            Backend API
          </a>
          <a
            href="https://github.com/leandrodsg/ai-ticket-classifier-web"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            Frontend React
          </a>
        </div>
      </footer>
    </div>
  );
}

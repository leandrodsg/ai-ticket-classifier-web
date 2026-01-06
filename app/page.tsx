'use client';

import { useState } from 'react';

type State = 'initial' | 'processing' | 'complete';

export default function Home() {
  const [state, setState] = useState<State>('initial');
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');

  const simulateApiCall = (endpoint: string, duration: number): Promise<string> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`Mock response from ${endpoint}`);
      }, duration);
    });
  };

  const handleGenerate = async () => {
    setState('processing');
    setProgress(0);
    setProgressText('Generating CSV...');

    try {
      // Step 1: Call POST /api/csv/generate
      const csvResponse = await simulateApiCall('/api/csv/generate', 1000);
      setProgress(50);
      setProgressText('Classifying tickets...');

      // Step 2: Decode base64 (mock)
      const decodedCsv = `ticket_id,subject,priority,category
1,Login issues,high,Authentication
2,Dark mode request,low,Feature Request
3,Payment error,critical,Billing`;

      // Step 3: Call POST /api/classify
      const classifyResponse = await simulateApiCall('/api/classify', 1000);
      setProgress(100);
      setProgressText('Complete!');

      // Simulate completion
      setTimeout(() => {
        setState('complete');
      }, 500);
    } catch (error) {
      console.error('Error:', error);
      setState('initial');
      setProgress(0);
    }
  };

  const handleOpenDashboard = () => {
    // TODO: navigate to /dashboard
    alert('Dashboard not implemented yet');
  };

  const handleGenerateAnother = () => {
    setState('initial');
    setProgress(0);
    setProgressText('');
  };

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-4xl font-bold mb-2">AI Ticket Classifier</h1>
          <p className="text-lg mb-8">Automated support ticket organization</p>

          {state === 'initial' && (
            <button
              onClick={handleGenerate}
              className="bg-accent text-white px-6 py-3 rounded-lg font-medium hover:bg-opacity-90 transition"
            >
              Generate Sample CSV
            </button>
          )}

          {state === 'processing' && (
            <div>
              <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
                <div
                  className="bg-accent h-4 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p>{progressText}</p>
            </div>
          )}

          {state === 'complete' && (
            <div>
              <p className="text-success font-medium mb-4">Sample dataset ready!</p>
              <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
                <div className="bg-success h-4 rounded-full w-full"></div>
              </div>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleOpenDashboard}
                  className="bg-accent text-white px-6 py-3 rounded-lg font-medium hover:bg-opacity-90 transition"
                >
                  Open Dashboard
                </button>
                <button
                  onClick={handleGenerateAnother}
                  className="border border-accent text-accent px-6 py-3 rounded-lg font-medium hover:bg-accent hover:text-white transition"
                >
                  Generate Another
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="bg-accent text-white py-4">
        <div className="flex justify-center gap-8">
          <a href="https://github.com/leandrodsg/ai-ticket-classifier-api" target="_blank" rel="noopener noreferrer">
            Backend API
          </a>
          <a href="https://github.com/leandrodsg/ai-ticket-classifier-web" target="_blank" rel="noopener noreferrer">
            Frontend React
          </a>
        </div>
      </footer>
    </div>
  );
}

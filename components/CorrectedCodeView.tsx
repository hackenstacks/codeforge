import React, { useState } from 'react';
import type { CodeReview } from '../types';
import { DownloadIcon } from './icons/DownloadIcon';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { CheckIcon } from './icons/CheckIcon';
import { CodeDiffViewer } from './CodeDiffViewer';

interface CorrectedCodeViewProps {
  review: CodeReview;
  originalCode: string;
  originalFileName: string | null;
  onDiscard: () => void;
}

export const CorrectedCodeView: React.FC<CorrectedCodeViewProps> = ({ review, originalCode, originalFileName, onDiscard }) => {
  const [copied, setCopied] = useState(false);

  const handleDownload = (content: string, isBackup: boolean = false) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    let downloadName = 'code.txt';
    if (originalFileName) {
        if(isBackup) {
            downloadName = `${originalFileName}.bak`;
        } else {
            downloadName = originalFileName;
        }
    } else {
        downloadName = isBackup ? 'original_code.bak' : 'corrected_code.txt';
    }
    
    a.download = downloadName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handleCopy = () => {
    navigator.clipboard.writeText(review.correctedCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700">
      <div className="flex flex-wrap justify-between items-center p-4 border-b border-gray-700 gap-4">
        <h2 className="text-xl font-semibold text-gray-300">Corrected Code</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleCopy}
            className="inline-flex items-center justify-center p-2 border border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 transition-colors"
            aria-label="Copy corrected code"
            title="Copy corrected code"
          >
            {copied ? <CheckIcon className="h-5 w-5 text-green-400" /> : <ClipboardIcon className="h-5 w-5" />}
          </button>
          <button
            onClick={() => handleDownload(originalCode, true)}
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 transition-colors"
          >
             <DownloadIcon className="h-5 w-5 mr-2" />
             Backup (.bak)
          </button>
          <button
            onClick={onDiscard}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-red-500 transition-colors"
          >
            Discard
          </button>
          <button
            onClick={() => handleDownload(review.correctedCode, false)}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 transition-colors"
          >
            <DownloadIcon className="h-5 w-5 mr-2" />
            Save Changes
          </button>
        </div>
      </div>
      <div className="p-4">
        <CodeDiffViewer 
            originalCode={originalCode}
            correctedCode={review.correctedCode}
            corrections={review.corrections}
        />
      </div>
    </div>
  );
};

import React from 'react';

interface CodeInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const CodeInput: React.FC<CodeInputProps> = ({ value, onChange }) => {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Paste your code here..."
      className="w-full h-[500px] p-4 bg-gray-800 text-gray-300 border border-gray-700 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
      spellCheck="false"
    />
  );
};

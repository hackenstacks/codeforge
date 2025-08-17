
import React from 'react';
import type { Correction, Recommendation } from '../types';

interface FeedbackCardProps {
  item: Correction | Recommendation;
  type: 'correction' | 'recommendation';
}

const isCorrection = (item: Correction | Recommendation): item is Correction => {
  return (item as Correction).problematicCode !== undefined;
};

export const FeedbackCard: React.FC<FeedbackCardProps> = ({ item, type }) => {
  const borderColor = type === 'correction' ? 'border-red-500/30' : 'border-green-500/30';

  return (
    <div className={`bg-gray-700/50 p-4 rounded-lg border ${borderColor}`}>
      {isCorrection(item) ? (
        <div className="space-y-3">
          {item.line && <span className="text-xs font-mono text-gray-400">Line: {item.line}</span>}
          <div>
            <h4 className="text-sm font-semibold text-red-400 mb-1">Problematic Code</h4>
            <pre className="bg-red-900/40 text-red-200 p-2 rounded-md text-xs font-mono overflow-x-auto">
              <code>{item.problematicCode}</code>
            </pre>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-green-400 mb-1">Suggested Fix</h4>
            <pre className="bg-green-900/40 text-green-200 p-2 rounded-md text-xs font-mono overflow-x-auto">
              <code>{item.suggestedFix}</code>
            </pre>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-1">Explanation</h4>
            <p className="text-sm text-gray-400">{item.explanation}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
           <h4 className="font-semibold text-gray-200 capitalize">{item.area}</h4>
           <p className="text-sm text-gray-300 font-medium">{item.suggestion}</p>
           <p className="text-sm text-gray-400">{item.explanation}</p>
        </div>
      )}
    </div>
  );
};

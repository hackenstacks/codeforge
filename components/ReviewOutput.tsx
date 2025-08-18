import React from 'react';
import type { CodeReview, Correction, Recommendation } from '../types';
import { FeedbackCard } from './FeedbackCard';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';

interface ReviewOutputProps {
  review: CodeReview;
}

export const ReviewOutput: React.FC<ReviewOutputProps> = ({ review }) => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h3 className="text-lg font-semibold text-blue-400 mb-2">Summary</h3>
        <p className="text-gray-300">{review.summary}</p>
      </div>

      {review.validationSummary && (
        <div>
            <h3 className="text-lg font-semibold text-purple-400 mb-3 flex items-center">
                <ShieldCheckIcon className="h-5 w-5 mr-2" />
                Validation Summary
            </h3>
            <div className="bg-gray-700/50 p-4 rounded-lg border border-purple-500/30">
                <p className="text-sm text-gray-300">{review.validationSummary}</p>
            </div>
        </div>
      )}

      {review.corrections.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-red-400 mb-4">Corrections</h3>
          <div className="space-y-4">
            {review.corrections.map((correction, index) => (
              <FeedbackCard key={`correction-${index}`} item={correction} type="correction" />
            ))}
          </div>
        </div>
      )}

      {review.recommendations.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-green-400 mb-4">Recommendations</h3>
          <div className="space-y-4">
            {review.recommendations.map((recommendation, index) => (
              <FeedbackCard key={`recommendation-${index}`} item={recommendation} type="recommendation" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
import React, { useState, useMemo } from 'react';
import * as Diff from 'diff';
import type { Correction } from '../types';
import { InfoIcon } from './icons/InfoIcon';

interface CodeDiffViewerProps {
  originalCode: string;
  correctedCode: string;
  corrections: Correction[];
}

export const CodeDiffViewer: React.FC<CodeDiffViewerProps> = ({ originalCode, correctedCode, corrections }) => {
  const [activeExplanation, setActiveExplanation] = useState<string | null>(null);

  const diffResult = useMemo(() => Diff.diffLines(originalCode, correctedCode, {
      ignoreWhitespace: false,
      newlineIsToken: true,
  }), [originalCode, correctedCode]);

  const findExplanationForLine = (lineNumber: number, content: string): string | null => {
    const byLine = corrections.find(c => c.line === lineNumber);
    if (byLine) return byLine.explanation;
    
    const byContent = corrections.find(c => 
        (c.problematicCode && content.includes(c.problematicCode.trim())) ||
        (c.suggestedFix && content.includes(c.suggestedFix.trim()))
    );
    return byContent ? byContent.explanation : null;
  };
  
  const handleInfoClick = (e: React.MouseEvent, explanation: string) => {
    e.stopPropagation();
    setActiveExplanation(explanation);
  };

  let originalLineCounter = 0;

  return (
    <div className="w-full bg-gray-900 text-gray-300 border border-gray-700 rounded-lg font-mono text-sm overflow-auto relative h-[500px]">
        <pre className="p-4" style={{tabSize: 4}}>
            <code>
                {diffResult.map((part, index) => {
                    const lines = part.value.split('\n').filter((line, i) => i < part.value.split('\n').length -1 || line !== '');
                    
                    return lines.map((line, lineIndex) => {
                        let lineContent = line || ' ';

                        let currentOriginalLineNumber = originalLineCounter;
                        
                        let explanation: string | null = null;
                        
                        if (part.added) {
                           explanation = findExplanationForLine(currentOriginalLineNumber, line);
                        } else {
                           originalLineCounter++;
                           currentOriginalLineNumber = originalLineCounter;
                        }

                        let className = "flex items-start -mx-4 px-4";
                        let lineSymbol = ' ';

                        if (part.added) {
                            className += " bg-red-900/40 text-red-200";
                            lineSymbol = '+';
                        } else if (part.removed) {
                            className += " bg-gray-800 text-gray-500 line-through";
                            lineSymbol = '-';
                        } else {
                            className += " hover:bg-gray-800/50";
                        }
                        
                        return (
                            <div key={`${index}-${lineIndex}`} className={className}>
                               <span className="w-8 select-none text-gray-500 text-right pr-2">{lineSymbol}</span>
                               <span className="flex-1 whitespace-pre-wrap">{lineContent}</span>
                               {explanation && (
                                   <button
                                      type="button"
                                      onClick={(e) => handleInfoClick(e, explanation)}
                                      title="Show explanation"
                                      aria-label="Show explanation"
                                      className="ml-2 mt-0.5 flex-shrink-0 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500"
                                   >
                                     <InfoIcon 
                                        className="h-4 w-4 text-blue-400"
                                      />
                                   </button>
                               )}
                            </div>
                        );
                    });
                })}
            </code>
        </pre>
        {activeExplanation && (
            <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4" onClick={() => setActiveExplanation(null)}>
                <div 
                    className="w-full max-w-2xl p-6 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 animate-fade-in relative" 
                    onClick={(e) => e.stopPropagation()}
                >
                    <h4 className="font-bold text-blue-400 mb-3 text-lg">Explanation</h4>
                    <p className="text-gray-300 whitespace-pre-wrap">{activeExplanation}</p>
                    <button 
                        onClick={() => setActiveExplanation(null)} 
                        className="absolute top-3 right-3 text-gray-400 hover:text-white text-2xl font-bold leading-none"
                        aria-label="Close explanation"
                    >
                        &times;
                    </button>
                </div>
            </div>
        )}
    </div>
  );
};
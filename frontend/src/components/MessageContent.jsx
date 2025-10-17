import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { formatMessageText, processTextBlock } from '../utils/formatMessage';

/**
 * Renders inline formatted elements (bold, italic, code)
 */
const InlineElements = ({ elements }) => {
  return (
    <>
      {elements.map((element, idx) => {
        switch (element.type) {
          case 'bold':
            return (
              <strong key={idx} className="font-bold">
                {element.content}
              </strong>
            );
          case 'italic':
            return (
              <em key={idx} className="italic">
                {element.content}
              </em>
            );
          case 'inline-code':
            return (
              <code
                key={idx}
                className="px-1.5 py-0.5 mx-0.5 rounded bg-gray-200/50 text-purple-700 font-mono text-xs"
              >
                {element.content}
              </code>
            );
          default:
            return <span key={idx}>{element.content}</span>;
        }
      })}
    </>
  );
};

/**
 * Code block component with copy button
 */
const CodeBlock = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  return (
    <div className="my-3 rounded-lg overflow-hidden border border-gray-300 bg-gray-50">
      <div className="flex items-center justify-between px-3 py-2 bg-gray-200 border-b border-gray-300">
        <span className="text-xs text-gray-600 font-mono">
          {language || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-300 rounded transition-colors duration-200"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check size={14} className="text-green-600" />
              <span className="text-green-600">Copied!</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto">
        <code className="text-xs font-mono text-gray-800">{code}</code>
      </pre>
    </div>
  );
};

/**
 * Main component to render formatted message content
 */
export default function MessageContent({ content, isUser }) {
  // For user messages, render as-is without formatting
  if (isUser) {
    return <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{content}</p>;
  }

  // Parse the message content
  const parts = formatMessageText(content);

  return (
    <div className="text-sm leading-relaxed space-y-2">
      {parts.map((part, partIdx) => {
        if (part.type === 'code') {
          // Code block with copy button
          return (
            <CodeBlock 
              key={partIdx} 
              code={part.content} 
              language={part.language} 
            />
          );
        } else {
          // Text content - process lines
          const lines = processTextBlock(part.content);
          
          return (
            <div key={partIdx} className="space-y-2">
              {lines.map((line, lineIdx) => {
                switch (line.type) {
                  case 'heading':
                    const HeadingTag = `h${Math.min(line.level, 6)}`;
                    const headingSizes = {
                      1: 'text-xl font-bold',
                      2: 'text-lg font-bold',
                      3: 'text-base font-bold',
                      4: 'text-sm font-bold',
                      5: 'text-sm font-semibold',
                      6: 'text-sm font-semibold'
                    };
                    return (
                      <HeadingTag
                        key={lineIdx}
                        className={`${headingSizes[line.level]} text-gray-900 mt-3 mb-2`}
                      >
                        <InlineElements elements={line.content} />
                      </HeadingTag>
                    );

                  case 'bullet':
                    return (
                      <div key={lineIdx} className="flex gap-2 items-start ml-1">
                        <span className="text-purple-600 mt-0.5">•</span>
                        <span className="flex-1">
                          <InlineElements elements={line.content} />
                        </span>
                      </div>
                    );

                  case 'numbered':
                    return (
                      <div key={lineIdx} className="flex gap-2 items-start ml-1">
                        <span className="text-purple-600 font-medium min-w-[20px]">
                          {line.number}.
                        </span>
                        <span className="flex-1">
                          <InlineElements elements={line.content} />
                        </span>
                      </div>
                    );

                  case 'paragraph':
                    return (
                      <p key={lineIdx} className="break-words">
                        <InlineElements elements={line.content} />
                      </p>
                    );

                  case 'empty':
                    return <div key={lineIdx} className="h-2" />;

                  default:
                    return null;
                }
              })}
            </div>
          );
        }
      })}
    </div>
  );
}

import React from 'react';
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
          // Code block
          return (
            <div key={partIdx} className="my-3 rounded-lg overflow-hidden border border-gray-300">
              {part.language && (
                <div className="px-3 py-1 bg-gray-200 text-xs text-gray-600 font-mono">
                  {part.language}
                </div>
              )}
              <pre className="p-3 bg-gray-50 overflow-x-auto">
                <code className="text-xs font-mono text-gray-800">{part.content}</code>
              </pre>
            </div>
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

/**
 * Formats message text with markdown-style formatting
 * Supports: **bold**, *italic*, bullet points, numbered lists, code blocks
 */
export const formatMessageText = (text) => {
  if (!text) return '';

  // Split by code blocks first to preserve them
  const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex, match.index)
      });
    }
    
    // Add code block
    parts.push({
      type: 'code',
      language: match[1] || '',
      content: match[2].trim()
    });
    
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.substring(lastIndex)
    });
  }

  // If no code blocks found, treat entire text as text
  if (parts.length === 0) {
    parts.push({ type: 'text', content: text });
  }

  return parts;
};

/**
 * Processes inline formatting (bold, italic, inline code)
 */
export const processInlineFormatting = (text) => {
  const elements = [];
  let currentIndex = 0;

  // Combined regex for all inline formatting
  const inlineRegex = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(`([^`]+)`)/g;
  let match;

  while ((match = inlineRegex.exec(text)) !== null) {
    // Add text before match
    if (match.index > currentIndex) {
      elements.push({
        type: 'text',
        content: text.substring(currentIndex, match.index)
      });
    }

    // Determine type and add formatted element
    if (match[1]) {
      // Bold: **text**
      elements.push({
        type: 'bold',
        content: match[2]
      });
    } else if (match[3]) {
      // Italic: *text*
      elements.push({
        type: 'italic',
        content: match[4]
      });
    } else if (match[5]) {
      // Inline code: `text`
      elements.push({
        type: 'inline-code',
        content: match[6]
      });
    }

    currentIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (currentIndex < text.length) {
    elements.push({
      type: 'text',
      content: text.substring(currentIndex)
    });
  }

  // If no matches found, return original text
  if (elements.length === 0) {
    elements.push({ type: 'text', content: text });
  }

  return elements;
};

/**
 * Processes a text block into lines with formatting
 */
export const processTextBlock = (text) => {
  const lines = text.split('\n');
  const processedLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for bullet points
    if (line.trim().match(/^[*\-•]\s/)) {
      processedLines.push({
        type: 'bullet',
        content: processInlineFormatting(line.trim().replace(/^[*\-•]\s/, ''))
      });
    }
    // Check for numbered lists
    else if (line.trim().match(/^\d+\.\s/)) {
      const match = line.trim().match(/^(\d+)\.\s(.+)/);
      processedLines.push({
        type: 'numbered',
        number: match[1],
        content: processInlineFormatting(match[2])
      });
    }
    // Check for headings
    else if (line.trim().match(/^#{1,6}\s/)) {
      const match = line.trim().match(/^(#{1,6})\s(.+)/);
      processedLines.push({
        type: 'heading',
        level: match[1].length,
        content: processInlineFormatting(match[2])
      });
    }
    // Regular text
    else if (line.trim()) {
      processedLines.push({
        type: 'paragraph',
        content: processInlineFormatting(line)
      });
    }
    // Empty line
    else {
      processedLines.push({
        type: 'empty'
      });
    }
  }

  return processedLines;
};

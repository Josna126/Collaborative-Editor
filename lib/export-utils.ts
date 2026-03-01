// Export utilities for Markdown and PDF

export const exportToMarkdown = (content: any): string => {
  let markdown = '';

  const processNode = (node: any): string => {
    let text = '';

    switch (node.type) {
      case 'paragraph':
        text = processChildren(node) + '\n\n';
        break;
      case 'heading':
        const level = node.attrs?.level || 1;
        text = '#'.repeat(level) + ' ' + processChildren(node) + '\n\n';
        break;
      case 'bulletList':
        text = processChildren(node);
        break;
      case 'orderedList':
        text = processChildren(node);
        break;
      case 'listItem':
        text = '- ' + processChildren(node) + '\n';
        break;
      case 'blockquote':
        text = '> ' + processChildren(node).replace(/\n/g, '\n> ') + '\n\n';
        break;
      case 'codeBlock':
        text = '```\n' + processChildren(node) + '\n```\n\n';
        break;
      case 'hardBreak':
        text = '\n';
        break;
      case 'text':
        let nodeText = node.text || '';
        if (node.marks) {
          for (const mark of node.marks) {
            switch (mark.type) {
              case 'bold':
                nodeText = `**${nodeText}**`;
                break;
              case 'italic':
                nodeText = `*${nodeText}*`;
                break;
              case 'strike':
                nodeText = `~~${nodeText}~~`;
                break;
              case 'code':
                nodeText = `\`${nodeText}\``;
                break;
            }
          }
        }
        text = nodeText;
        break;
      default:
        text = processChildren(node);
    }

    return text;
  };

  const processChildren = (node: any): string => {
    if (!node.content) return '';
    return node.content.map(processNode).join('');
  };

  markdown = processNode(content);
  return markdown.trim();
};

export const downloadMarkdown = (content: any, filename: string = 'document.md') => {
  const markdown = exportToMarkdown(content);
  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const downloadPDF = async (content: any, filename: string = 'document.pdf') => {
  // Convert to HTML first
  const html = convertToHTML(content);
  
  // Create a printable version
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to download PDF');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${filename}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 40px auto;
            padding: 20px;
            color: #333;
          }
          h1, h2, h3 { margin-top: 24px; margin-bottom: 16px; }
          h1 { font-size: 2em; border-bottom: 1px solid #eee; padding-bottom: 8px; }
          h2 { font-size: 1.5em; }
          h3 { font-size: 1.25em; }
          p { margin-bottom: 16px; }
          ul, ol { margin-bottom: 16px; padding-left: 32px; }
          blockquote {
            border-left: 4px solid #ddd;
            padding-left: 16px;
            color: #666;
            margin: 16px 0;
          }
          code {
            background: #f5f5f5;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
          }
          pre {
            background: #f5f5f5;
            padding: 16px;
            border-radius: 6px;
            overflow-x: auto;
          }
          pre code {
            background: none;
            padding: 0;
          }
        </style>
      </head>
      <body>
        ${html}
      </body>
    </html>
  `);

  printWindow.document.close();
  
  // Wait for content to load then trigger print
  setTimeout(() => {
    printWindow.print();
  }, 250);
};

const convertToHTML = (content: any): string => {
  const processNode = (node: any): string => {
    switch (node.type) {
      case 'paragraph':
        return `<p>${processChildren(node)}</p>`;
      case 'heading':
        const level = node.attrs?.level || 1;
        return `<h${level}>${processChildren(node)}</h${level}>`;
      case 'bulletList':
        return `<ul>${processChildren(node)}</ul>`;
      case 'orderedList':
        return `<ol>${processChildren(node)}</ol>`;
      case 'listItem':
        return `<li>${processChildren(node)}</li>`;
      case 'blockquote':
        return `<blockquote>${processChildren(node)}</blockquote>`;
      case 'codeBlock':
        return `<pre><code>${escapeHtml(processChildren(node))}</code></pre>`;
      case 'hardBreak':
        return '<br>';
      case 'text':
        let text = escapeHtml(node.text || '');
        if (node.marks) {
          for (const mark of node.marks) {
            switch (mark.type) {
              case 'bold':
                text = `<strong>${text}</strong>`;
                break;
              case 'italic':
                text = `<em>${text}</em>`;
                break;
              case 'strike':
                text = `<s>${text}</s>`;
                break;
              case 'code':
                text = `<code>${text}</code>`;
                break;
            }
          }
        }
        return text;
      default:
        return processChildren(node);
    }
  };

  const processChildren = (node: any): string => {
    if (!node.content) return '';
    return node.content.map(processNode).join('');
  };

  const escapeHtml = (text: string): string => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  return processNode(content);
};

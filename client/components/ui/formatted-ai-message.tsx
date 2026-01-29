"use client";

import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface FormattedAiMessageProps {
  content: string;
  className?: string;
}

export function FormattedAiMessage({
  content,
  className,
}: FormattedAiMessageProps) {
  return (
    <div className={cn("formatted-ai-message", className)}>
      <ReactMarkdown
        components={{
          // Headings - clean and compact
          h1: ({ children }) => (
            <h3 className="text-sm font-semibold text-foreground mb-2 mt-3 first:mt-0">
              {children}
            </h3>
          ),
          h2: ({ children }) => (
            <h4 className="text-sm font-semibold text-foreground mb-2 mt-3 first:mt-0">
              {children}
            </h4>
          ),
          h3: ({ children }) => (
            <h5 className="text-sm font-medium text-foreground mb-1.5 mt-2.5 first:mt-0">
              {children}
            </h5>
          ),

          // Paragraphs
          p: ({ children }) => (
            <p className="text-sm leading-relaxed mb-2 last:mb-0">{children}</p>
          ),

          // Unordered lists - bullet points
          ul: ({ children }) => (
            <ul className="text-sm space-y-1.5 mb-2 last:mb-0 pl-4 list-disc marker:text-primary/60">
              {children}
            </ul>
          ),
          // Ordered lists - numbers
          ol: ({ children }) => (
            <ol className="text-sm space-y-1.5 mb-2 last:mb-0 pl-4 list-decimal marker:text-primary/60 marker:font-medium">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed pl-1">
              {children}
            </li>
          ),

          // Emphasis
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-muted-foreground">{children}</em>
          ),

          // Code
          code: ({ children, className }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="px-1.5 py-0.5 rounded-md bg-muted/80 text-xs font-mono text-foreground">
                  {children}
                </code>
              );
            }
            return (
              <code className="block p-2.5 rounded-lg bg-muted/80 text-xs font-mono overflow-x-auto my-2">
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="my-2 first:mt-0 last:mb-0">{children}</pre>
          ),

          // Links
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              {children}
            </a>
          ),

          // Horizontal rule
          hr: () => <hr className="my-3 border-border/50" />,

          // Blockquote
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-primary/30 pl-3 my-2 text-sm text-muted-foreground italic">
              {children}
            </blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

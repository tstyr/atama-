"use client";

import { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathContentProps {
  content: string;
  className?: string;
}

export function MathContent({ content, className = '' }: MathContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    try {
      // $$...$$（ディスプレイ数式）を処理
      let processedContent = content.replace(/\$\$(.*?)\$\$/g, (match, formula) => {
        try {
          return `<div class="math-display">${katex.renderToString(formula, {
            displayMode: true,
            throwOnError: false,
          })}</div>`;
        } catch (e) {
          console.error('KaTeX display error:', e);
          return match;
        }
      });

      // $...$（インライン数式）を処理
      processedContent = processedContent.replace(/\$(.*?)\$/g, (match, formula) => {
        try {
          return katex.renderToString(formula, {
            displayMode: false,
            throwOnError: false,
          });
        } catch (e) {
          console.error('KaTeX inline error:', e);
          return match;
        }
      });

      // 改行を<br>に変換
      processedContent = processedContent.replace(/\n/g, '<br/>');

      containerRef.current.innerHTML = processedContent;
    } catch (error) {
      console.error('Error rendering math:', error);
      containerRef.current.textContent = content;
    }
  }, [content]);

  return (
    <div 
      ref={containerRef} 
      className={`math-content ${className}`}
      style={{
        lineHeight: '1.8',
        fontSize: '1.1rem',
      }}
    />
  );
}

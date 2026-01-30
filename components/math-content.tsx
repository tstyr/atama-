"use client";

import { useEffect, useRef } from 'react';

interface MathContentProps {
  content: string;
  className?: string;
}

export function MathContent({ content, className = '' }: MathContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    try {
      // 数式を読みやすいHTMLに変換
      let processedContent = content;

      // $$...$$（ディスプレイ数式）を処理
      processedContent = processedContent.replace(/\$\$(.*?)\$\$/g, (match, formula) => {
        return `<div class="math-display" style="text-align: center; margin: 1rem 0; font-size: 1.3rem;">${formatMath(formula)}</div>`;
      });

      // $...$（インライン数式）を処理
      processedContent = processedContent.replace(/\$(.*?)\$/g, (match, formula) => {
        return `<span class="math-inline" style="font-size: 1.1rem;">${formatMath(formula)}</span>`;
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

// 数式を読みやすいHTMLに変換
function formatMath(formula: string): string {
  let result = formula;

  // \frac{分子}{分母} を 分数表示に変換
  result = result.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, (match, numerator, denominator) => {
    return `<span style="display: inline-block; vertical-align: middle;">
      <span style="display: block; text-align: center; border-bottom: 1px solid currentColor; padding: 0 0.3em;">${formatMath(numerator)}</span>
      <span style="display: block; text-align: center; padding: 0 0.3em;">${formatMath(denominator)}</span>
    </span>`;
  });

  // \sqrt{x} を √x に変換
  result = result.replace(/\\sqrt\{([^}]+)\}/g, (match, content) => {
    return `<span style="position: relative; padding-left: 0.2em;">
      <span style="font-size: 1.2em;">√</span><span style="text-decoration: overline;">${formatMath(content)}</span>
    </span>`;
  });

  // x^{2} を x² に変換
  result = result.replace(/([a-zA-Z0-9])\^\{([^}]+)\}/g, (match, base, exponent) => {
    return `${base}<sup style="font-size: 0.8em;">${exponent}</sup>`;
  });

  // x^2 を x² に変換（中括弧なし）
  result = result.replace(/([a-zA-Z0-9])\^([0-9])/g, (match, base, exponent) => {
    return `${base}<sup style="font-size: 0.8em;">${exponent}</sup>`;
  });

  // x_{2} を x₂ に変換
  result = result.replace(/([a-zA-Z0-9])_\{([^}]+)\}/g, (match, base, subscript) => {
    return `${base}<sub style="font-size: 0.8em;">${subscript}</sub>`;
  });

  // ギリシャ文字の変換
  const greekLetters: Record<string, string> = {
    'alpha': 'α', 'beta': 'β', 'gamma': 'γ', 'delta': 'δ',
    'epsilon': 'ε', 'theta': 'θ', 'lambda': 'λ', 'mu': 'μ',
    'pi': 'π', 'sigma': 'σ', 'phi': 'φ', 'omega': 'ω',
    'Alpha': 'Α', 'Beta': 'Β', 'Gamma': 'Γ', 'Delta': 'Δ',
    'Theta': 'Θ', 'Lambda': 'Λ', 'Sigma': 'Σ', 'Phi': 'Φ', 'Omega': 'Ω'
  };

  Object.entries(greekLetters).forEach(([latex, symbol]) => {
    result = result.replace(new RegExp(`\\\\${latex}\\b`, 'g'), symbol);
  });

  // その他の記号
  result = result.replace(/\\times/g, '×');
  result = result.replace(/\\div/g, '÷');
  result = result.replace(/\\pm/g, '±');
  result = result.replace(/\\leq/g, '≤');
  result = result.replace(/\\geq/g, '≥');
  result = result.replace(/\\neq/g, '≠');
  result = result.replace(/\\approx/g, '≈');
  result = result.replace(/\\infty/g, '∞');

  return result;
}

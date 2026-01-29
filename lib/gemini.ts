import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);
export const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// 理解度診断問題の生成
export async function generateDiagnosticQuestions(
  subject: string,
  unitName: string,
  difficulty: string,
  count: number = 5
) {
  const difficultyMap = {
    basic: '基本用語の確認、教科書レベルの基礎',
    standard: '共通テスト・入試標準レベル',
    advanced: '難関大入試・応用・記述レベル'
  };

  const prompt = `あなたは高校の${subject}の専門教師です。

単元: ${unitName}
難易度: ${difficultyMap[difficulty as keyof typeof difficultyMap]}

現在の理解度を診断するための問題を${count}問作成してください。

以下のJSON形式で回答してください：
[
  {
    "question": "問題文",
    "expectedAnswer": "期待される回答のポイント"
  }
]

JSON形式のみで回答し、他の説明は不要です。`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  
  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Failed to parse AI response:', e);
  }
  
  return [];
}

// AI講義の生成（atama+スタイル：簡潔・図解重視）
export async function generateLecture(
  subject: string,
  unitName: string,
  description: string,
  difficulty: string
) {
  const difficultyMap = {
    basic: '基本用語の確認、教科書レベルの基礎',
    standard: '共通テスト・入試標準レベル',
    advanced: '難関大入試・応用・記述レベル'
  };

  const prompt = `あなたは高校の${subject}の専門教師です。

単元: ${unitName}
説明: ${description}
難易度: ${difficultyMap[difficulty as keyof typeof difficultyMap]}

atama+スタイルの簡潔な講義を作成してください。

【講義の構成】
1. **核心**（この単元で最も重要な1つのポイント）
2. **3つのエッセンス**（覚えるべき重要事項を3つだけ）
3. **図解**（記号や矢印を使ってテキストで表現）
4. **よくある間違い**（1-2個）

【重要】
- 長々とした説明は不要
- 要点だけを簡潔に
- 箇条書きと図解を活用
- Markdown形式で構造化

Markdown形式で回答してください。`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

// 演習問題の生成（過去の誤答データに基づく）
export async function generatePracticeQuestion(
  subject: string,
  unitName: string,
  difficulty: string,
  weakPoints?: string[]
) {
  const difficultyMap = {
    basic: '基本用語の確認、教科書レベルの基礎',
    standard: '共通テスト・入試標準レベル',
    advanced: '難関大入試・応用・記述レベル'
  };

  const weakPointContext = weakPoints && weakPoints.length > 0
    ? `\n\n【過去に特定された弱点】\n${weakPoints.join('\n')}\n上記の弱点を克服できる問題を作成してください。`
    : '';

  const prompt = `あなたは高校の${subject}の専門教師です。

単元: ${unitName}
難易度: ${difficultyMap[difficulty as keyof typeof difficultyMap]}${weakPointContext}

演習問題を1問作成してください。

以下のJSON形式で回答してください：
{
  "question": "問題文",
  "expectedAnswer": "期待される回答のポイント"
}

JSON形式のみで回答し、他の説明は不要です。`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Failed to parse AI response:', e);
  }
  
  return { question: '', expectedAnswer: '' };
}

// 回答の評価と弱点特定
export async function evaluateAnswer(
  question: string,
  userAnswer: string,
  expectedAnswer: string
) {
  const prompt = `あなたは高校の専門教師です。以下の問題に対する生徒の回答を評価してください。

【問題】
${question}

【期待される回答】
${expectedAnswer}

【生徒の回答】
${userAnswer}

以下のJSON形式で回答してください：
{
  "isCorrect": true/false,
  "feedback": "評価コメント（2-3文で簡潔に、励ましの言葉も含める）",
  "weakPoint": "この回答から分かる理解不足の箇所（1文で）"
}

JSON形式のみで回答し、他の説明は不要です。`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Failed to parse AI response:', e);
  }
  
  return {
    isCorrect: false,
    feedback: '評価に失敗しました。',
    weakPoint: ''
  };
}

// カスタム単元の生成（AI相談）
export async function generateCustomUnit(userQuery: string, subject: string) {
  const prompt = `ユーザーが「${userQuery}」という内容を学習したいと言っています。

教科: ${subject}

この学習ニーズに対して、新しい学習単元を提案してください。

以下のJSON形式で回答してください：
{
  "unit_name": "単元名（20文字以内）",
  "description": "単元の説明（50文字以内）",
  "difficulty_level": 1-5の整数,
  "estimated_time": 推定学習時間（分）,
  "prerequisite_concepts": ["前提知識1", "前提知識2"]
}

JSON形式のみで回答し、他の説明は不要です。`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Failed to parse AI response:', e);
  }
  
  return null;
}

// 単元検索（既存機能）
export async function searchUnit(query: string, subjects: string[]) {
  const prompt = `ユーザーが「${query}」というキーワードで学習したい単元を探しています。

以下の教科リストから、最も関連性の高い教科と単元を3つ提案してください：
${subjects.join(', ')}

以下のJSON形式で回答してください：
[
  {
    "subject": "教科名",
    "unit": "単元名",
    "reason": "この単元を提案する理由（1文）"
  }
]

JSON形式のみで回答し、他の説明は不要です。`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  
  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Failed to parse AI response:', e);
  }
  
  return [];
}

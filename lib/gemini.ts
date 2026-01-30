import { GoogleGenerativeAI } from '@google/generative-ai';

// 環境変数のチェック（ビルド時にエラーを防ぐ）
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
if (!apiKey && typeof window !== 'undefined') {
  console.warn('NEXT_PUBLIC_GEMINI_API_KEY is not set');
}

const genAI = new GoogleGenerativeAI(apiKey);
export const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// 理解度診断問題の生成
export async function generateDiagnosticQuestions(
  subject: string,
  unitName: string,
  difficulty: string,
  count: number = 5
) {
  const difficultyMap = {
    beginner: '基礎レベル。用語の意味や基本的な概念を確認。',
    intermediate: '標準レベル。基本的な計算や理解を確認。',
    advanced: '応用レベル。深い理解や応用力を確認。'
  };

  const prompt = `あなたは高校の${subject}の専門教師です。

単元: ${unitName}
難易度: ${difficultyMap[difficulty as keyof typeof difficultyMap]}

現在の理解度を診断するための問題を${count}問作成してください。

【重要な指示】
1. 問題は段階的に難しくする（1問目が最も簡単、最後が最も難しい）
2. 最初の問題は必ず基本用語や定義の確認から始める
3. 数式はLaTeX記法を使わず、読みやすい形式で書く

【数式の書き方】
- 分数: 1/2 または (分子)/(分母)
- 平方根: √2 または sqrt(2)
- 累乗: x^2 または x²
- LaTeX記法は使わない（$や\\fracなど）

以下のJSON形式で回答してください：
[
  {
    "question": "問題文（数式はLaTeXを使わず、読みやすい形式で）",
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
    beginner: '中学生でも理解できる基礎レベル。専門用語は最小限に。',
    intermediate: '高校基礎レベル。教科書の基本事項を理解している前提。',
    advanced: '高校応用レベル。入試問題に対応できる深い理解。'
  };

  const prompt = `あなたは高校の${subject}の専門教師です。

単元: ${unitName}
説明: ${description}
難易度: ${difficultyMap[difficulty as keyof typeof difficultyMap]}

【重要な指示】
この講義は「予備知識がない生徒」でも理解できるように作成してください。

【講義の構成】
1. **この単元で学ぶこと**（1文で、中学生でも分かる言葉で）

2. **基礎から理解する**
   - 専門用語を使う前に、日常的な言葉で説明
   - 「なぜそうなるのか」を必ず説明
   - 具体例を必ず1つ以上含める

3. **重要ポイント3つ**
   - 覚えるべき最重要事項を3つだけ
   - それぞれに簡単な例を添える

4. **よくある間違い**
   - 初学者が陥りやすい間違いを1-2個
   - なぜ間違えるのか、どう考えれば正しいのかを説明

【数式の書き方】
- 数式は必ず読みやすく書く
- 分数: 1/2 または (分子)/(分母)
- 平方根: √2 または sqrt(2)
- 累乗: x^2 または x²
- LaTeX記法は使わない（$や\\fracなど）

【文章のルール】
- 1文は短く（30文字以内を目安）
- 専門用語の後には必ず（説明）を付ける
- 「つまり」「例えば」「なぜなら」を積極的に使う
- 箇条書きを活用

Markdown形式で、見出しと箇条書きを使って構造化してください。`;

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
    beginner: '基礎レベル。公式や定義を確認する問題。',
    intermediate: '標準レベル。公式を使って解く問題。',
    advanced: '応用レベル。複数の知識を組み合わせる問題。'
  };

  const weakPointContext = weakPoints && weakPoints.length > 0
    ? `\n\n【過去に特定された弱点】\n${weakPoints.join('\n')}\n上記の弱点を克服できる問題を作成してください。`
    : '';

  const prompt = `あなたは高校の${subject}の専門教師です。

単元: ${unitName}
難易度: ${difficultyMap[difficulty as keyof typeof difficultyMap]}${weakPointContext}

【重要な指示】
演習問題を1問作成してください。問題文は明確で、解答の方向性が分かるようにしてください。

【数式の書き方】
- 数式は必ず読みやすく書く
- 分数: 1/2 または (分子)/(分母)
- 平方根: √2 または sqrt(2)
- 累乗: x^2 または x²
- LaTeX記法は使わない（$や\\fracなど）

【問題作成のルール】
1. 問題文は具体的に（「次の値を求めよ」など）
2. 必要な情報はすべて問題文に含める
3. 計算問題の場合、数値は簡単なものにする
4. 記述問題の場合、何を答えればよいか明確にする

以下のJSON形式で回答してください：
{
  "question": "問題文（数式はLaTeXを使わず、読みやすい形式で）",
  "expectedAnswer": "期待される回答のポイント（採点基準として使用）"
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

【評価の指針】
1. 部分点を考慮する（完全に正解でなくても、理解している部分は評価）
2. フィードバックは具体的に（何が良くて、何が足りないか）
3. 励ましの言葉を含める
4. 次に何を学べばよいか示唆する

以下のJSON形式で回答してください：
{
  "isCorrect": true/false（部分的に正解の場合はfalse）,
  "explanation": "詳しい解説（正解の場合も、なぜ正解なのか説明する。不正解の場合は、どこが違うか、正しい考え方は何かを説明。3-5文で。）",
  "weakPoint": "この回答から分かる理解不足の箇所（1文で。正解の場合は空文字列）"
}

JSON形式のみで回答し、他の説明は不要です。`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      // explanationをfeedbackとしても使えるようにする
      return {
        isCorrect: parsed.isCorrect,
        explanation: parsed.explanation,
        feedback: parsed.explanation, // 互換性のため
        weakPoint: parsed.weakPoint || ''
      };
    }
  } catch (e) {
    console.error('Failed to parse AI response:', e);
  }
  
  return {
    isCorrect: false,
    explanation: '評価に失敗しました。もう一度お試しください。',
    feedback: '評価に失敗しました。もう一度お試しください。',
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

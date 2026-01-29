// プリセット単元データ（高校各教科の主要単元）
export const presetUnits = [
  // 数学
  { subject: '数学', unit_key: 'math-numbers-and-formulas', unit_name: '数と式', description: '整式の計算、因数分解、実数', difficulty_level: 1, estimated_time: 45 },
  { subject: '数学', unit_key: 'math-quadratic-functions', unit_name: '二次関数', description: '二次関数のグラフ、最大・最小', difficulty_level: 2, estimated_time: 60, prerequisite_units: ['math-numbers-and-formulas'] },
  { subject: '数学', unit_key: 'math-trigonometry', unit_name: '三角比', description: '正弦・余弦・正接、三角比の応用', difficulty_level: 2, estimated_time: 50 },
  { subject: '数学', unit_key: 'math-probability', unit_name: '場合の数と確率', description: '順列・組合せ、確率の基本', difficulty_level: 2, estimated_time: 55 },
  { subject: '数学', unit_key: 'math-sequences', unit_name: '数列', description: '等差数列、等比数列、漸化式', difficulty_level: 3, estimated_time: 65 },
  { subject: '数学', unit_key: 'math-vectors', unit_name: 'ベクトル', description: '平面ベクトル、空間ベクトル', difficulty_level: 3, estimated_time: 60 },
  { subject: '数学', unit_key: 'math-differentiation', unit_name: '微分法', description: '導関数、接線、関数の増減', difficulty_level: 3, estimated_time: 70 },
  { subject: '数学', unit_key: 'math-integration', unit_name: '積分法', description: '不定積分、定積分、面積', difficulty_level: 4, estimated_time: 70, prerequisite_units: ['math-differentiation'] },

  // 英語コミュニケーション
  { subject: '英語コミュニケーション', unit_key: 'eng-tenses', unit_name: '時制', description: '現在・過去・未来、完了形', difficulty_level: 1, estimated_time: 40 },
  { subject: '英語コミュニケーション', unit_key: 'eng-passive', unit_name: '受動態', description: '受動態の基本と応用', difficulty_level: 2, estimated_time: 35 },
  { subject: '英語コミュニケーション', unit_key: 'eng-infinitive', unit_name: '不定詞', description: '名詞的・形容詞的・副詞的用法', difficulty_level: 2, estimated_time: 45 },
  { subject: '英語コミュニケーション', unit_key: 'eng-gerund', unit_name: '動名詞', description: '動名詞の用法と慣用表現', difficulty_level: 2, estimated_time: 40 },
  { subject: '英語コミュニケーション', unit_key: 'eng-participle', unit_name: '分詞', description: '現在分詞・過去分詞、分詞構文', difficulty_level: 3, estimated_time: 50 },
  { subject: '英語コミュニケーション', unit_key: 'eng-relative', unit_name: '関係詞', description: '関係代名詞・関係副詞', difficulty_level: 3, estimated_time: 55 },
  { subject: '英語コミュニケーション', unit_key: 'eng-comparison', unit_name: '比較', description: '原級・比較級・最上級', difficulty_level: 2, estimated_time: 35 },

  // 論理表現
  { subject: '論理表現', unit_key: 'logic-sentence-structure', unit_name: '文型と文構造', description: '5文型、SVOCの理解', difficulty_level: 1, estimated_time: 40 },
  { subject: '論理表現', unit_key: 'logic-conditionals', unit_name: '仮定法', description: '仮定法過去・過去完了', difficulty_level: 3, estimated_time: 50 },
  { subject: '論理表現', unit_key: 'logic-subjunctive', unit_name: '話法', description: '直接話法・間接話法', difficulty_level: 2, estimated_time: 40 },

  // 現代の国語
  { subject: '現代の国語', unit_key: 'jpn-reading-comprehension', unit_name: '評論文読解', description: '論理展開の把握、要旨理解', difficulty_level: 2, estimated_time: 50 },
  { subject: '現代の国語', unit_key: 'jpn-novel', unit_name: '小説読解', description: '心情理解、表現技法', difficulty_level: 2, estimated_time: 45 },
  { subject: '現代の国語', unit_key: 'jpn-writing', unit_name: '小論文', description: '論理的な文章の書き方', difficulty_level: 3, estimated_time: 60 },

  // 言語文化
  { subject: '言語文化', unit_key: 'classic-grammar', unit_name: '古典文法', description: '助動詞、助詞、敬語', difficulty_level: 2, estimated_time: 55 },
  { subject: '言語文化', unit_key: 'classic-reading', unit_name: '古文読解', description: '物語・随筆の読解', difficulty_level: 3, estimated_time: 50 },
  { subject: '言語文化', unit_key: 'kanbun', unit_name: '漢文', description: '返り点、句法', difficulty_level: 2, estimated_time: 45 },

  // 化学
  { subject: '化学', unit_key: 'chem-atoms', unit_name: '原子の構造', description: '原子番号、電子配置', difficulty_level: 1, estimated_time: 40 },
  { subject: '化学', unit_key: 'chem-periodic', unit_name: '周期表', description: '元素の周期性、族の特徴', difficulty_level: 2, estimated_time: 45 },
  { subject: '化学', unit_key: 'chem-bonding', unit_name: '化学結合', description: 'イオン結合、共有結合、金属結合', difficulty_level: 2, estimated_time: 50 },
  { subject: '化学', unit_key: 'chem-mole', unit_name: '物質量', description: 'モル計算、化学反応式', difficulty_level: 2, estimated_time: 55 },
  { subject: '化学', unit_key: 'chem-acid-base', unit_name: '酸と塩基', description: 'pH、中和反応', difficulty_level: 3, estimated_time: 50 },
  { subject: '化学', unit_key: 'chem-redox', unit_name: '酸化還元', description: '酸化数、電池、電気分解', difficulty_level: 3, estimated_time: 60 },

  // 物理
  { subject: '物理', unit_key: 'phys-motion', unit_name: '等加速度運動', description: '速度、加速度、運動方程式', difficulty_level: 2, estimated_time: 50 },
  { subject: '物理', unit_key: 'phys-force', unit_name: '力と運動', description: 'ニュートンの法則、力のつり合い', difficulty_level: 2, estimated_time: 55 },
  { subject: '物理', unit_key: 'phys-energy', unit_name: '仕事とエネルギー', description: '運動エネルギー、位置エネルギー', difficulty_level: 2, estimated_time: 50 },
  { subject: '物理', unit_key: 'phys-wave', unit_name: '波動', description: '波の性質、干渉、回折', difficulty_level: 3, estimated_time: 55 },
  { subject: '物理', unit_key: 'phys-electricity', unit_name: '電気', description: 'オームの法則、電気回路', difficulty_level: 2, estimated_time: 50 },

  // 生物
  { subject: '生物', unit_key: 'bio-cell', unit_name: '細胞の構造', description: '細胞小器官、原核細胞と真核細胞', difficulty_level: 1, estimated_time: 40 },
  { subject: '生物', unit_key: 'bio-dna', unit_name: 'DNAと遺伝子', description: 'DNA構造、複製、転写、翻訳', difficulty_level: 2, estimated_time: 55 },
  { subject: '生物', unit_key: 'bio-metabolism', unit_name: '代謝', description: '呼吸、光合成、酵素', difficulty_level: 3, estimated_time: 60 },
  { subject: '生物', unit_key: 'bio-genetics', unit_name: '遺伝', description: 'メンデルの法則、遺伝子の組み合わせ', difficulty_level: 2, estimated_time: 50 },

  // 歴史総合
  { subject: '歴史総合', unit_key: 'hist-meiji', unit_name: '明治維新', description: '開国、近代化政策', difficulty_level: 2, estimated_time: 45 },
  { subject: '歴史総合', unit_key: 'hist-ww1', unit_name: '第一次世界大戦', description: '大戦の原因と影響', difficulty_level: 2, estimated_time: 50 },
  { subject: '歴史総合', unit_key: 'hist-ww2', unit_name: '第二次世界大戦', description: '戦争の経過と戦後処理', difficulty_level: 2, estimated_time: 55 },
  { subject: '歴史総合', unit_key: 'hist-cold-war', unit_name: '冷戦', description: '東西対立、冷戦構造', difficulty_level: 2, estimated_time: 50 },

  // 公共
  { subject: '公共', unit_key: 'civics-constitution', unit_name: '日本国憲法', description: '基本原理、人権保障', difficulty_level: 2, estimated_time: 50 },
  { subject: '公共', unit_key: 'civics-politics', unit_name: '政治制度', description: '国会、内閣、裁判所', difficulty_level: 2, estimated_time: 45 },
  { subject: '公共', unit_key: 'civics-economy', unit_name: '経済の仕組み', description: '市場経済、財政、金融', difficulty_level: 2, estimated_time: 55 },
  { subject: '公共', unit_key: 'civics-international', unit_name: '国際社会', description: '国際連合、国際問題', difficulty_level: 2, estimated_time: 50 },
];

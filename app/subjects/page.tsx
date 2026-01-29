"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  BookOpen, Calculator, Globe, Users, Pen, 
  FileText, Atom, Zap, Leaf, Search 
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { searchUnit } from "@/lib/gemini";

const subjects = [
  {
    id: "english-communication",
    name: "英語コミュニケーション",
    description: "リーディング・リスニング・スピーキング",
    icon: Globe,
    color: "text-blue-500",
  },
  {
    id: "logical-expression",
    name: "論理表現",
    description: "英作文・文法・論理的思考",
    icon: Pen,
    color: "text-cyan-500",
  },
  {
    id: "mathematics",
    name: "数学",
    description: "数学I・A・II・B・C",
    icon: Calculator,
    color: "text-purple-500",
  },
  {
    id: "history",
    name: "歴史総合",
    description: "日本史・世界史",
    icon: BookOpen,
    color: "text-amber-500",
  },
  {
    id: "civics",
    name: "公共",
    description: "政治・経済・倫理",
    icon: Users,
    color: "text-green-500",
  },
  {
    id: "language-culture",
    name: "言語文化",
    description: "古典・漢文",
    icon: FileText,
    color: "text-rose-500",
  },
  {
    id: "modern-japanese",
    name: "現代の国語",
    description: "現代文・評論・小説",
    icon: BookOpen,
    color: "text-indigo-500",
  },
  {
    id: "chemistry",
    name: "化学",
    description: "化学基礎・化学",
    icon: Atom,
    color: "text-orange-500",
  },
  {
    id: "physics",
    name: "物理",
    description: "物理基礎・物理",
    icon: Zap,
    color: "text-yellow-500",
  },
  {
    id: "biology",
    name: "生物",
    description: "生物基礎・生物",
    icon: Leaf,
    color: "text-emerald-500",
  },
];

export default function SubjectsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
interface SearchResult {
  subject: string;
  unit: string;
  reason: string;
}

export default function SubjectsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [highlightedSubject, setHighlightedSubject] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
      }
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    const delaySearch = setTimeout(async () => {
      if (searchQuery.trim().length > 1) {
        setSearching(true);
        try {
          const results = await searchUnit(
            searchQuery,
            subjects.map(s => s.name)
          );
          setSearchResults(results);
          if (results.length > 0) {
            const firstResult = results[0];
            const matchedSubject = subjects.find(s => s.name === firstResult.subject);
            setHighlightedSubject(matchedSubject?.id || null);
          }
        } catch (error) {
          console.error("Search error:", error);
        } finally {
          setSearching(false);
        }
      } else {
        setSearchResults([]);
        setHighlightedSubject(null);
      }
    }, 500);

    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  const handleSubjectClick = (subjectId: string, subjectName: string) => {
    router.push(`/map/${encodeURIComponent(subjectName)}`);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8 space-y-4">
        <h1 className="text-4xl font-bold">教科を選択</h1>
        <p className="text-muted-foreground">学習したい教科を選んでください</p>
        
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="学習したい内容を検索（例：二次関数、明治維新、DNA）"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12"
          />
        </div>

        {searching && (
          <p className="text-sm text-muted-foreground">検索中...</p>
        )}

        {searchResults.length > 0 && (
          <div className="bg-accent/50 rounded-lg p-4 space-y-2">
            <p className="font-semibold text-sm">AI推奨単元:</p>
            {searchResults.map((result, index) => (
              <div 
                key={index} 
                className="text-sm p-2 rounded hover:bg-accent cursor-pointer transition-colors"
                onClick={async () => {
                  // 単元を検索してIDを取得
                  const { data: units } = await supabase
                    .from('units')
                    .select('id')
                    .eq('subject', result.subject)
                    .eq('unit_name', result.unit)
                    .single();
                  
                  if (units) {
                    router.push(`/learn/${units.id}`);
                  }
                }}
              >
                <span className="font-medium">{result.subject}</span> - {result.unit}
                <p className="text-muted-foreground text-xs">{result.reason}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects.map((subject, index) => {
          const Icon = subject.icon;
          const isHighlighted = highlightedSubject === subject.id;
          
          return (
            <motion.div
              key={subject.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  isHighlighted ? "ring-2 ring-primary shadow-xl" : ""
                }`}
                onClick={() => handleSubjectClick(subject.id, subject.name)}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-accent ${subject.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-xl">{subject.name}</CardTitle>
                  </div>
                  <CardDescription>{subject.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    クリックして学習を開始
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

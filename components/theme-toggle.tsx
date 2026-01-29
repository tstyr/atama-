"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <Button variant="ghost" size="icon"><Palette className="h-5 w-5" /></Button>;
  }

  const themes = [
    { value: "white", label: "White", icon: Sun },
    { value: "gray", label: "Gray", icon: Monitor },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "black", label: "Black", icon: Moon },
  ];

  return (
    <div className="flex items-center gap-2">
      {themes.map(({ value, label, icon: Icon }) => (
        <Button
          key={value}
          variant={theme === value ? "default" : "ghost"}
          size="sm"
          onClick={() => setTheme(value)}
          className="gap-2"
        >
          <Icon className="h-4 w-4" />
          <span className="hidden sm:inline">{label}</span>
        </Button>
      ))}
    </div>
  );
}

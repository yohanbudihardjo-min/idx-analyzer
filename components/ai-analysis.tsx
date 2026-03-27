"use client";

import { useState } from "react";
import { useCompletion } from "@ai-sdk/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageResponse } from "@/components/ai-elements/message";
import { Zap, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIAnalysisProps {
  framework: string;
  firmName: string;
  stockData: Record<string, unknown>;
}

export function AIAnalysis({ framework, firmName, stockData }: AIAnalysisProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { completion, complete, isLoading, error } = useCompletion({
    api: `/api/ai/${framework}`,
  });

  function handleGenerate() {
    setIsOpen(true);
    complete(JSON.stringify(stockData));
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            AI Analysis — {firmName} Framework
          </CardTitle>
          <div className="flex items-center gap-2">
            {completion && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen((v) => !v)}
                className="h-7 px-2 text-xs"
              >
                {isOpen ? (
                  <><ChevronUp className="h-3 w-3 mr-1" />Tutup</>
                ) : (
                  <><ChevronDown className="h-3 w-3 mr-1" />Lihat</>
                )}
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleGenerate}
              disabled={isLoading}
              className="h-7 px-3 text-xs"
            >
              {isLoading ? (
                <><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Generating...</>
              ) : completion ? (
                <><RefreshCw className="h-3 w-3 mr-1" />Regenerate</>
              ) : (
                <>Generate Analysis</>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {error && (
        <CardContent className="pt-0">
          <p className="text-xs text-destructive">
            Error: {error.message}. Pastikan VERCEL_OIDC_TOKEN tersedia (jalankan{" "}
            <code className="font-mono bg-muted px-1 rounded">vercel env pull</code>).
          </p>
        </CardContent>
      )}

      {(isOpen || isLoading) && completion && (
        <CardContent className={cn("pt-0", !isOpen && "hidden")}>
          <div className="prose prose-sm prose-invert max-w-none text-sm">
            <MessageResponse>{completion}</MessageResponse>
          </div>
        </CardContent>
      )}

      {isLoading && !completion && (
        <CardContent className="pt-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <RefreshCw className="h-3 w-3 animate-spin" />
            Generating analysis dengan Claude Sonnet 4.6...
          </div>
        </CardContent>
      )}
    </Card>
  );
}

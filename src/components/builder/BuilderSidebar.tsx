import { ChevronRight, Folder, MessageSquare } from "lucide-react";
import type { Category, Question } from "@/types/assessment";

interface Props {
  categories: Category[];
  questions: Question[];
  selectedCategoryId: string | null;
  selectedQuestionId: string | null;
  onSelectCategory: (id: string) => void;
  onSelectQuestion: (questionId: string, categoryId: string) => void;
}

export function BuilderSidebar({
  categories, questions, selectedCategoryId, selectedQuestionId,
  onSelectCategory, onSelectQuestion
}: Props) {
  return (
    <div className="w-64 flex-shrink-0 border-r bg-card overflow-auto">
      <div className="p-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Structure</p>
        {categories.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">No categories yet</p>
        ) : (
          <div className="space-y-0.5">
            {categories.map(cat => {
              const catQuestions = questions.filter(q => q.category_id === cat.id);
              const isSelected = cat.id === selectedCategoryId;
              return (
                <div key={cat.id}>
                  <button
                    onClick={() => onSelectCategory(cat.id)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm transition-colors ${
                      isSelected && !selectedQuestionId
                        ? "bg-accent/10 text-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <div className="h-3 w-3 flex-shrink-0" style={{ backgroundColor: cat.colour || "#4A90D9" }} />
                    <span className="truncate flex-1 text-left">{cat.name}</span>
                    <span className="text-xs text-muted-foreground">{catQuestions.length}</span>
                  </button>
                  {isSelected && catQuestions.length > 0 && (
                    <div className="ml-5 border-l pl-2 space-y-0.5">
                      {catQuestions.map(q => (
                        <button
                          key={q.id}
                          onClick={() => onSelectQuestion(q.id, cat.id)}
                          className={`w-full flex items-center gap-1.5 px-2 py-1 text-xs transition-colors ${
                            selectedQuestionId === q.id
                              ? "bg-accent/10 text-foreground font-medium"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <MessageSquare className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate text-left">{q.text || "Untitled question"}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

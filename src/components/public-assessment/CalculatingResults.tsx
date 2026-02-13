import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";

interface Props {
  brandColour: string;
}

export function CalculatingResults({ brandColour }: Props) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => Math.min(prev + 5, 95));
    }, 100);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="text-center max-w-sm">
      <h2 className="text-xl font-semibold mb-4">Calculating your results...</h2>
      <Progress value={progress} className="h-2 mb-3" />
      <p className="text-sm text-muted-foreground">Please wait while we process your responses.</p>
    </div>
  );
}

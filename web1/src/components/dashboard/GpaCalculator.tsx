import { useState } from "react";
import { Calculator, Target, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { GpaRing } from "./GpaRing";

interface GpaCalculatorProps {
  currentCgpa: number;
  completedCredits: number;
  className?: string;
}

export function GpaCalculator({
  currentCgpa,
  completedCredits,
  className,
}: GpaCalculatorProps) {
  const [targetCgpa, setTargetCgpa] = useState(8.5);
  const [currentSemesterCredits, setCurrentSemesterCredits] = useState(24);

  const totalCredits = completedCredits + currentSemesterCredits;
  const requiredSgpa = 
    ((targetCgpa * totalCredits) - (currentCgpa * completedCredits)) / currentSemesterCredits;

  const isFeasible = requiredSgpa <= 10 && requiredSgpa >= 0;
  const isEasy = requiredSgpa <= 7;
  const isModerate = requiredSgpa > 7 && requiredSgpa <= 8.5;

  const getFeasibilityStatus = () => {
    if (!isFeasible) return { icon: AlertTriangle, text: "Not Achievable", color: "text-destructive" };
    if (isEasy) return { icon: CheckCircle, text: "Easily Achievable", color: "text-success" };
    if (isModerate) return { icon: TrendingUp, text: "Challenging but Possible", color: "text-accent" };
    return { icon: Target, text: "Requires Excellence", color: "text-primary" };
  };

  const status = getFeasibilityStatus();
  const StatusIcon = status.icon;

  return (
    <div className={cn("rounded-xl border border-border bg-card p-6", className)}>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary">
          <Calculator className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h3 className="font-semibold">GPA Goal Calculator</h3>
          <p className="text-sm text-muted-foreground">Plan your path to success</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Target CGPA</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="5"
                max="10"
                step="0.1"
                value={targetCgpa}
                onChange={(e) => setTargetCgpa(parseFloat(e.target.value))}
                className="flex-1 accent-primary"
              />
              <span className="w-12 rounded-md bg-muted px-2 py-1 text-center text-sm font-medium">
                {targetCgpa.toFixed(1)}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Current Semester Credits</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="12"
                max="30"
                step="1"
                value={currentSemesterCredits}
                onChange={(e) => setCurrentSemesterCredits(parseInt(e.target.value))}
                className="flex-1 accent-primary"
              />
              <span className="w-12 rounded-md bg-muted px-2 py-1 text-center text-sm font-medium">
                {currentSemesterCredits}
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Current CGPA</span>
              <span className="font-medium">{currentCgpa.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Completed Credits</span>
              <span className="font-medium">{completedCredits}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Credits After</span>
              <span className="font-medium">{totalCredits}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center space-y-4">
          <GpaRing
            value={isFeasible ? requiredSgpa : 0}
            maxValue={10}
            size="lg"
            label="Required SGPA"
          />
          
          <div className={cn("flex items-center gap-2 rounded-full border px-4 py-2", status.color)}>
            <StatusIcon className="h-4 w-4" />
            <span className="text-sm font-medium">{status.text}</span>
          </div>

          {isFeasible && (
            <p className="text-center text-sm text-muted-foreground">
              You need a minimum SGPA of <span className="font-semibold text-foreground">{requiredSgpa.toFixed(2)}</span> this semester to achieve your target
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

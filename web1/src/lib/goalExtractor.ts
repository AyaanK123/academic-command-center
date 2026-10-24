export interface ExtractedGoal {
  title: string;
  description: string;
  deadline?: string;
  category?: string;
}

export const extractGoalsFromText = (text: string): ExtractedGoal[] => {
  const lines = text
    .split("\n")
    .map(l => l.trim())
    .filter(l => l.length > 10);

  const goals: ExtractedGoal[] = [];

  for (const line of lines) {
    // Heuristic rules (LLM comes later)
    if (
      line.match(/(assignment|project|exam|submit|complete|finish)/i)
    ) {
      goals.push({
        title: line.slice(0, 80),
        description: line,
        category: "Academic",
      });
    }
  }

  return goals.slice(0, 10); // safety cap
};

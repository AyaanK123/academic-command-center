const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export interface AIAnalysis {
  urgency: number;
  importance: number;
  difficulty: number;
  priority: "high" | "medium" | "low";
  suggestion: string;
}

export interface CourseRecommendation {
  courseName: string;
  reason: string;
  priority: number;
}

export interface CareerCourseRecommendations {
  recommended: CourseRecommendation[];
  explanation: string;
}

export const analyzeGoalWithAI = async (goal: {
  title: string;
  description: string;
  deadline?: string;
  category?: string;
}): Promise<AIAnalysis> => {
  if (!API_KEY || API_KEY === 'undefined') {
    console.warn('⚠️ API key not configured');
    throw new Error('API key not configured');
  }

  const prompt = `Analyze this goal and return ONLY this JSON (no markdown, no explanation):
{"urgency": <1-10>, "importance": <1-10>, "difficulty": <1-10>, "priority": "high|medium|low", "suggestion": "<one sentence>"}

Goal: "${goal.title}"
Details: "${goal.description || 'None'}"
Category: "${goal.category || 'General'}"
Deadline: "${goal.deadline || 'None'}"

Priority rules: "high" if urgency>=7 OR importance>=8, "low" if both<5, else "medium"`;

  try {
    console.log('🤖 Calling Gemini 2.5 Flash API...');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { 
            temperature: 0.3,
            maxOutputTokens: 1024,
            topP: 0.8,
            topK: 40
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error ${response.status}:`, errorText);
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      console.error('Unexpected API response:', data);
      throw new Error('Invalid API response');
    }

    let text = data.candidates[0].content.parts[0].text;
    console.log('📥 Raw AI response:', text);
    
    text = text.trim();
    text = text.replace(/```json\s*/g, '');
    text = text.replace(/```\s*/g, '');
    
    const startIndex = text.indexOf('{');
    if (startIndex > 0) {
      text = text.substring(startIndex);
    }
    
    const endIndex = text.lastIndexOf('}');
    if (endIndex > 0) {
      text = text.substring(0, endIndex + 1);
    }
    
    console.log('🧹 Cleaned response:', text);
    
    let analysis;
    try {
      analysis = JSON.parse(text);
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError);
      console.error('📄 Failed text:', text);
      throw new Error('Invalid JSON from AI');
    }
    
    const result: AIAnalysis = {
      urgency: Math.min(10, Math.max(1, Number(analysis.urgency) || 5)),
      importance: Math.min(10, Math.max(1, Number(analysis.importance) || 5)),
      difficulty: Math.min(10, Math.max(1, Number(analysis.difficulty) || 5)),
      priority: ['high', 'medium', 'low'].includes(analysis.priority) 
        ? analysis.priority 
        : 'medium',
      suggestion: String(analysis.suggestion || 'Focus on completing this goal.').slice(0, 200)
    };

    console.log('✅ AI Analysis complete:', result);
    return result;

  } catch (error) {
    console.error('❌ Error in analyzeGoalWithAI:', error);
    throw error;
  }
};

// Helper function to extract valid JSON from text
function extractJSON(text: string): any {
  // Try to find JSON objects in the text
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON object found in response');
  }
  
  let jsonText = jsonMatch[0];
  
  // Try parsing as-is first
  try {
    return JSON.parse(jsonText);
  } catch (e) {
    // If it fails, try to fix common issues
    console.log('⚠️ Initial parse failed, attempting to fix JSON...');
    
    // Find the last complete object before truncation
    let depth = 0;
    let lastValidIndex = -1;
    
    for (let i = 0; i < jsonText.length; i++) {
      if (jsonText[i] === '{' || jsonText[i] === '[') {
        depth++;
      } else if (jsonText[i] === '}' || jsonText[i] === ']') {
        depth--;
        if (depth === 0) {
          lastValidIndex = i;
        }
      }
    }
    
    if (lastValidIndex > 0) {
      jsonText = jsonText.substring(0, lastValidIndex + 1);
      try {
        return JSON.parse(jsonText);
      } catch (e2) {
        console.error('Failed to parse truncated JSON');
      }
    }
    
    throw new Error('Could not extract valid JSON');
  }
}

// AI-powered course recommendations with fallback
export const getCareerCourseRecommendations = async (
  careerGoal: string,
  availableCourses: string[],
  branch: string,
  currentSemester: number
): Promise<CareerCourseRecommendations> => {
  // If no API key, use fallback immediately
  if (!API_KEY || API_KEY === 'undefined') {
    console.log('⚠️ No API key, using fallback recommendations');
    return getFallbackCourseRecommendations(careerGoal, availableCourses, branch, currentSemester);
  }

  // Limit to first 15 courses to reduce response size
  const courseList = availableCourses.slice(0, 15);

  // Simpler, more concise prompt
  const prompt = `You're a career advisor. Student: ${branch}, Semester ${currentSemester}, Career goal: ${careerGoal}.

Courses available: ${courseList.join(', ')}

Pick TOP 5 courses for this career. Return ONLY valid JSON with NO markdown:
{"recommended":[{"courseName":"exact name","reason":"short reason","priority":10}],"explanation":"brief text"}

Use EXACT course names. Keep reasons under 50 words. Make response SHORT.`;

  try {
    console.log('🎯 Getting AI course recommendations for:', careerGoal);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { 
            temperature: 0.2,  // Lower temperature for more consistent output
            maxOutputTokens: 1500,  // Reduced token limit
            topP: 0.7,
            topK: 30
          }
        })
      }
    );

    if (!response.ok) {
      console.warn(`API error ${response.status}, using fallback`);
      return getFallbackCourseRecommendations(careerGoal, availableCourses, branch, currentSemester);
    }

    const data = await response.json();
    
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.warn('Invalid API response, using fallback');
      return getFallbackCourseRecommendations(careerGoal, availableCourses, branch, currentSemester);
    }

    let text = data.candidates[0].content.parts[0].text.trim();
    console.log('📥 Raw course recommendations:', text.substring(0, 200) + '...');
    
    // Clean markdown code blocks
    text = text.replace(/```json\s*/gi, '');
    text = text.replace(/```\s*/g, '');
    text = text.trim();
    
    console.log('🧹 Cleaned text length:', text.length);
    
    let recommendations;
    try {
      recommendations = extractJSON(text);
    } catch (parseError) {
      console.error('❌ JSON parsing failed:', parseError);
      console.log('Falling back to local recommendations');
      return getFallbackCourseRecommendations(careerGoal, availableCourses, branch, currentSemester);
    }
    
    // Validate and sanitize the response
    if (!recommendations.recommended || !Array.isArray(recommendations.recommended)) {
      console.warn('Invalid recommendations structure, using fallback');
      return getFallbackCourseRecommendations(careerGoal, availableCourses, branch, currentSemester);
    }

    const result: CareerCourseRecommendations = {
      recommended: recommendations.recommended
        .slice(0, 5)
        .map((rec: any) => ({
          courseName: String(rec.courseName || '').trim(),
          reason: String(rec.reason || 'Recommended for career').slice(0, 150),
          priority: Math.min(10, Math.max(1, Number(rec.priority) || 5))
        }))
        .filter((rec: CourseRecommendation) => 
          rec.courseName.length > 0 && 
          availableCourses.includes(rec.courseName)
        ),
      explanation: String(
        recommendations.explanation || 
        `These courses will help build skills for ${careerGoal}.`
      ).slice(0, 300)
    };

    // If we got no valid recommendations, use fallback
    if (result.recommended.length === 0) {
      console.warn('No valid courses in AI response, using fallback');
      return getFallbackCourseRecommendations(careerGoal, availableCourses, branch, currentSemester);
    }

    console.log('✅ AI Recommendations ready:', result.recommended.length, 'courses');
    return result;

  } catch (error) {
    console.error('❌ Error getting recommendations:', error);
    console.log('Using fallback recommendations');
    return getFallbackCourseRecommendations(careerGoal, availableCourses, branch, currentSemester);
  }
};

// Fallback course recommendations
function getFallbackCourseRecommendations(
  careerGoal: string,
  availableCourses: string[],
  branch: string,
  currentSemester: number
): CareerCourseRecommendations {
  console.log('🔧 Using fallback recommendations for:', careerGoal);

  const careerKeywords: Record<string, string[]> = {
    "AI Researcher": ["Machine Learning", "Deep Learning", "Artificial Intelligence", "Natural Language Processing", "Data Mining"],
    "Data Scientist": ["Machine Learning", "Big Data", "Statistics", "Data Mining", "Artificial Intelligence"],
    "Software Engineer": ["Data Structures", "Operating Systems", "Database", "Software Engineering", "Compiler"],
    "Cybersecurity Specialist": ["Network Security", "Cyber Security", "Cryptography", "Ethical Hacking", "Computer Networks"],
    "Core Electrical Engineer": ["VLSI", "Embedded Systems", "Circuit", "Power Systems", "Signals"],
    "Mechanical Design Engineer": ["Robotics", "Finite Element", "CAD", "Automotive", "Thermodynamics"],
    "Civil Infrastructure Engineer": ["Earthquake", "Smart Cities", "Structural", "Construction"],
    "Chemical Process Engineer": ["Nanomaterials", "Green Energy", "Chemical Reaction", "Petroleum", "Bioprocess"]
  };

  const keywords = careerKeywords[careerGoal] || [];
  const recommended: CourseRecommendation[] = [];

  // Find courses matching keywords
  keywords.forEach((keyword, index) => {
    const matchingCourse = availableCourses.find(course => 
      course.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (matchingCourse && !recommended.find(r => r.courseName === matchingCourse)) {
      recommended.push({
        courseName: matchingCourse,
        reason: `Essential skill for ${careerGoal} career path`,
        priority: 10 - index
      });
    }
  });

  // If we found fewer than 3, add some generic recommendations
  if (recommended.length < 3) {
    availableCourses.slice(0, 5 - recommended.length).forEach(course => {
      if (!recommended.find(r => r.courseName === course)) {
        recommended.push({
          courseName: course,
          reason: `Beneficial for building foundational skills`,
          priority: 5
        });
      }
    });
  }

  return {
    recommended: recommended.slice(0, 5),
    explanation: `These courses align with ${careerGoal} requirements and will help build relevant skills for semester ${currentSemester}.`
  };
}

// Fallback analysis function
export const getFallbackAnalysis = (goal: {
  title: string;
  description: string;
  deadline?: string;
  category?: string;
}): AIAnalysis => {
  console.log('🔧 Using fallback analysis for:', goal.title);
  
  const daysUntil = goal.deadline 
    ? Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 30;

  let urgency = 5;
  let priority: "high" | "medium" | "low" = "medium";
  let importance = 6;
  let difficulty = 5;

  if (daysUntil <= 0) {
    urgency = 10;
    priority = "high";
  } else if (daysUntil <= 1) {
    urgency = 10;
    priority = "high";
  } else if (daysUntil <= 3) {
    urgency = 9;
    priority = "high";
  } else if (daysUntil <= 7) {
    urgency = 7;
    priority = "high";
  } else if (daysUntil <= 14) {
    urgency = 5;
    priority = "medium";
  } else if (daysUntil <= 30) {
    urgency = 3;
    priority = "low";
  } else {
    urgency = 2;
    priority = "low";
  }

  switch (goal.category) {
    case "Academic":
    case "Assignment":
      importance = 9;
      difficulty = 7;
      priority = urgency >= 5 ? "high" : "medium";
      break;
    case "Career":
      importance = 8;
      difficulty = 6;
      break;
    case "Skills":
    case "Learning":
      importance = 7;
      difficulty = 5;
      break;
    default:
      importance = 6;
      difficulty = 5;
  }

  const titleLower = goal.title.toLowerCase();
  if (titleLower.includes('project') || titleLower.includes('research')) {
    difficulty = 8;
  } else if (titleLower.includes('exam') || titleLower.includes('test')) {
    difficulty = 7;
  } else if (titleLower.includes('assignment') || titleLower.includes('homework')) {
    difficulty = 6;
  }

  let suggestion = "";
  if (daysUntil <= 0) {
    suggestion = "⚠️ OVERDUE! This requires immediate attention.";
  } else if (priority === "high") {
    suggestion = daysUntil <= 1
      ? `Critical! Complete this today to meet the deadline.`
      : `High priority with ${daysUntil} days remaining. Schedule dedicated time blocks.`;
  } else if (priority === "medium") {
    suggestion = `Medium priority - plan regular work sessions over the next ${daysUntil} days.`;
  } else {
    suggestion = `Lower priority - work on this during free time after completing urgent tasks.`;
  }

  if (goal.category === "Assignment" || goal.category === "Academic") {
    suggestion += " Break into smaller milestones for better tracking.";
  }

  return {
    urgency,
    importance,
    difficulty,
    priority,
    suggestion
  };
};
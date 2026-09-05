export interface TestQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
}

export const analyzePerformance = async (base64Image: string): Promise<string> => {
  const response = await fetch("/api/ai/analyzePerformance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ base64Image }),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || "Failed to analyze performance document");
  }
  const data = await response.json();
  return data.text || '';
};

export const generateSubjectTest = async (subject: string, levelOfStudies: string, levelSummary: string): Promise<TestQuestion[]> => {
  const response = await fetch("/api/ai/generateSubjectTest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subject, levelOfStudies, levelSummary }),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || "Failed to generate test");
  }
  const data = await response.json();
  try {
    return JSON.parse(data.text || '[]');
  } catch (e) {
    console.error("Failed to parse AI generated test", e);
    throw new Error("Failed to generate test. Please try again.");
  }
};

export const gradeTest = async (userAnswers: string[], questions: TestQuestion[]): Promise<number> => {
  let correctCount = 0;
  questions.forEach((q, index) => {
    if (userAnswers[index] === q.correctAnswer) {
      correctCount++;
    }
  });
  if (questions.length === 0) return 0;
  return Math.round((correctCount / questions.length) * 100);
};

export const generateFeedback = async (subject: string, performanceSummary: string, questions: TestQuestion[], userAnswers: string[]): Promise<string> => {
  const response = await fetch("/api/ai/generateFeedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subject, performanceSummary, questions, userAnswers }),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || "Failed to generate feedback");
  }
  const data = await response.json();
  return data.text || '';
};

export const scanAndSolve = async (base64Image: string, subjectPreset: string, customContext: string, preferredLanguage: string = "Auto-detect"): Promise<string> => {
  const response = await fetch("/api/ai/scanAndSolve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ base64Image, subjectPreset, customContext, preferredLanguage }),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || "Failed to scan and solve document");
  }
  const data = await response.json();
  return data.text || "Sorry, I spent too long looking at the scan. Could you try uploading or capture a clearer image?";
};

export const generateStudyQuiz = async (studySubject: string, customTopic: string): Promise<any> => {
  const response = await fetch("/api/ai/generateStudyQuiz", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ studySubject, customTopic }),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || "Failed to generate study quiz");
  }
  const data = await response.json();
  try {
    return JSON.parse(data.text || "{}");
  } catch (e) {
    console.error("Failed to parse generated study quiz JSON", e);
    throw new Error("Failed to generate test. Please try again.");
  }
};

export const gradeStudyQuiz = async (studySubject: string, customTopic: string, answersLog: any[]): Promise<any> => {
  const response = await fetch("/api/ai/gradeStudyQuiz", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ studySubject, customTopic, answersLog }),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || "Failed to grade study quiz");
  }
  const data = await response.json();
  try {
    return JSON.parse(data.text || "{}");
  } catch (e) {
    console.error("Failed to parse graded study quiz JSON", e);
    throw new Error("Failed to process test grading. Please try again.");
  }
};

export const generateSchedule = async (subject: string, topic: string, studyTime: string): Promise<string[]> => {
  const response = await fetch("/api/ai/generateSchedule", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subject, topic, studyTime }),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || "Failed to generate study schedule");
  }
  const data = await response.json();
  const text = data.text || "";
  return text.split("\n").filter((s: string) => s.trim() !== "");
};

export const chatWithTutor = async (systemInstruction: string, messages: any[], userInput: string): Promise<string> => {
  const response = await fetch("/api/ai/chatWithTutor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ systemInstruction, messages, userInput }),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || "Failed to communicate with tutor");
  }
  const data = await response.json();
  return data.text || "I'm sorry, I couldn't process that.";
};

export const chatWithPremiumTutor = async (
  systemInstruction: string,
  messages: any[],
  userInput: string
): Promise<{
  text: string;
  premiumData?: {
    analysis: string;
    image?: string;
    workedExample?: string;
    exampleImage?: string;
    references?: { uri: string; title: string }[];
  };
}> => {
  const response = await fetch("/api/ai/chatWithTutor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ systemInstruction, messages, userInput, isPremium: true }),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || "Failed to communicate with tutor");
  }
  return response.json();
};

export const generateStudyNotes = async (
  subject: string,
  weakArea: string,
  onChunk?: (chunk: string) => void
): Promise<string> => {
  const response = await fetch("/api/ai/generateStudyNotes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subject, weakArea }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || "Failed to generate study guide notes");
  }

  if (response.body) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let accumulated = "";
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // Keep any partial line

      for (const line of lines) {
        const cleanLine = line.trim();
        if (!cleanLine) continue;

        if (cleanLine.startsWith("data: ")) {
          const dataPart = cleanLine.substring(6);
          if (dataPart === "[DONE]") {
            break;
          }
          try {
            const parsed = JSON.parse(dataPart);
            if (parsed.text) {
              accumulated += parsed.text;
              if (onChunk) {
                onChunk(parsed.text);
              }
            }
          } catch (e) {
            // Ignore incomplete / bad JSON lines
          }
        }
      }
    }
    return accumulated;
  }

  return "";
};

export const fetchDailyObjectives = async (subject?: string): Promise<any[]> => {
  const response = await fetch("/api/ai/generateDailyObjectives", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subject }),
  });
  if (!response.ok) {
    throw new Error("Failed to generate daily objectives");
  }
  const data = await response.json();
  return data.objectives || [];
};

export const fetchDailyReevaluationMessage = async (testHistory: any[], subject?: string): Promise<string> => {
  const response = await fetch("/api/ai/generateReevaluation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ testHistory, subject }),
  });
  if (!response.ok) {
    throw new Error("Failed to generate reevaluation companion message");
  }
  const data = await response.json();
  return data.text || "";
};

export const submitDailyReevaluationAnswer = async (question: string, userAnswer: string): Promise<{ score: number; feedback: string; passed: boolean }> => {
  const response = await fetch("/api/ai/evaluateReevaluation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, userAnswer }),
  });
  if (!response.ok) {
    throw new Error("Failed to evaluate answer");
  }
  return response.json();
};

export const generateWeeklyTutorTest = async (subject: string): Promise<any[]> => {
  const response = await fetch("/api/ai/generateWeeklyTutorTest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subject }),
  });
  if (!response.ok) {
    throw new Error("Failed to generate weekly tutor test");
  }
  const data = await response.json();
  return data.questions || [];
};


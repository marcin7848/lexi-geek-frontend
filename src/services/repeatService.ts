// Service for simulating repeat API requests

export interface StartRepeatRequest {
  categoryIds: number[];
  includeChosen: boolean;
  wordCount: number;
  method: string;
}

export interface CheckAnswerRequest {
  wordId: number;
  answers: { [key: string]: string };
}

export const repeatService = {
  startRepeat: async (data: StartRepeatRequest): Promise<void> => {
    // Simulate API call
    console.log("Starting repeat with data:", data);
    await new Promise(resolve => setTimeout(resolve, 300));
  },

  checkAnswer: async (data: CheckAnswerRequest): Promise<void> => {
    // Simulate API call
    console.log("Checking answer:", data);
    await new Promise(resolve => setTimeout(resolve, 300));
  },
};

export interface FeedbackSubmission {
  name: string;
  email: string;
  role: string;
  category: string;
  subject: string;
  rating: number;
  message: string;
}

interface StoredFeedback extends FeedbackSubmission {
  submittedAt: string;
}

interface FeedbackResponse {
  success: boolean;
  message?: string;
}

const STORAGE_KEY = "aquagrid-feedback";

export const feedbackService = {
  async submitFeedback(feedback: FeedbackSubmission): Promise<FeedbackResponse> {
    const storedFeedback = localStorage.getItem(STORAGE_KEY);
    const submissions: StoredFeedback[] = storedFeedback
      ? JSON.parse(storedFeedback) as StoredFeedback[]
      : [];

    if (!Array.isArray(submissions)) {
      throw new Error("Stored feedback data is invalid. Clear the browser's feedback storage and try again.");
    }

    submissions.push({ ...feedback, submittedAt: new Date().toISOString() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions));

    return { success: true };
  },
};

import { GoogleGenAI } from '@google/genai';
import { TranslationDirection, Difficulty, Topic, EvaluationResult, BatchItem, BatchEvaluationResponse, SpeakingMode, SpeakingPrompt, SpeakingFeedback } from '../types';

const API_KEY = process.env.GEMINI_API_KEY || '';

// Lazy initialization to avoid crash if key is missing during startup
let genAI: GoogleGenAI | null = null;

function getGenAI() {
  if (!genAI) {
    if (!API_KEY) {
      console.warn('GEMINI_API_KEY is not configured. AI features will not work.');
      return null;
    }
    genAI = new GoogleGenAI({ apiKey: API_KEY });
  }
  return genAI;
}

export const aiService = {
  async generateSentence(
    direction: TranslationDirection,
    topic: Topic,
    difficulty: Difficulty
  ): Promise<string> {
    const ai = getGenAI();
    if (!ai) throw new Error('API Key not configured');

    const sourceLang = direction === 'JA_TO_VI' ? 'Japanese' : 'Vietnamese';
    const targetLang = direction === 'JA_TO_VI' ? 'Vietnamese' : 'Japanese';

    const prompt = `Generate ONE sentence in ${sourceLang} for someone to translate it into ${targetLang}.
    Topic: ${topic}
    Difficulty: ${difficulty}
    
    Requirements:
    - Return ONLY the sentence text.
    - Do not add any introduction or additional info.
    - The sentence should be natural and modern.
    - For Japanese, ensure correct politeness level suitable for ${difficulty} level (e.g., beginner uses desu/masu).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text.trim();
  },

  async generateInterviewQuestions(role: string, level: string, topic: string): Promise<string[]> {
    const ai = getGenAI();
    if (!ai) return ["AI is not ready"];

    const prompt = `Generate 5 interview questions in Japanese for a ${role} position. The candidate's Japanese level is ${level}. The focus is on "${topic}". Return ONLY a JSON array of strings.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });
    try {
      return JSON.parse(response.text);
    } catch (e) {
      return ["質問の生成に失敗しました。"];
    }
  },

  async evaluateInterview(transcript: string): Promise<any> {
    const ai = getGenAI();
    if (!ai) throw new Error('AI Key not configured');

    const prompt = `Analyze this Japanese interview transcript and provide feedback in JSON format.
    Transcript: ${transcript}
    
    Required JSON structure:
    {
      "overallScore": number (0-100),
      "fluencyScore": number (0-100),
      "grammarScore": number (0-100),
      "vocabularyScore": number (0-100),
      "interviewContentScore": number (0-100),
      "professionalismScore": number (0-100),
      "overallComment": "string",
      "strengths": ["string"],
      "weakPoints": ["string"],
      "improvedAnswers": [{"originalAnswer": "string", "betterAnswer": "string", "explanationInVietnamese": "string"}],
      "usefulPhrases": [{"japanese": "string", "vietnamese": "string"}],
      "nextPracticeSuggestions": ["string"]
    }`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });
    
    return JSON.parse(response.text);
  },

  async evaluateBatchTranslations(items: BatchItem[]): Promise<BatchEvaluationResponse> {
    const ai = getGenAI();
    if (!ai) throw new Error('API Key not configured');

    const prompt = `You are a Japanese-Vietnamese translation teacher. Evaluate the following batch of translations.
    
    Items:
    ${JSON.stringify(items, null, 2)}

    Instructions:
    1. Evaluate each translation independently.
    2. Follow the grading criteria: Accuracy, Grammar, Vocabulary, Naturalness.
    3. Provide feedback in Vietnamese.
    4. Return ONLY valid JSON matching this schema:
    {
      "results": [
        {
          "id": "string (the original id provided)",
          "score": number,
          "overallComment": "string",
          "accuracyFeedback": "string",
          "grammarFeedback": "string",
          "vocabularyFeedback": "string",
          "naturalnessFeedback": "string",
          "suggestedTranslation": "string",
          "corrections": [
            {
              "userPhrase": "string",
              "betterPhrase": "string",
              "explanation": "string"
            }
          ]
        }
      ]
    }
    5. Do not include markdown or explanations outside the JSON.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });
      
      return JSON.parse(response.text) as BatchEvaluationResponse;
    } catch (e) {
      console.error('Batch AI Evaluation failed', e);
      throw new Error('Chấm hàng loạt thất bại. Vui lòng thử lại hoặc giảm số câu mỗi lượt.');
    }
  },

  async generateSpeakingPrompt(mode: SpeakingMode, topic: Topic, difficulty: Difficulty): Promise<SpeakingPrompt> {
    const ai = getGenAI();
    if (!ai) throw new Error('API Key not configured');

    const prompt = `Generate a Japanese speaking practice prompt.
    Mode: ${mode} (VI_TO_JP_SPEAKING: User sees Vietnamese, says Japanese. JP_TO_JP_SHADOWING: User sees Japanese, repeats it.)
    Topic: ${topic}
    Difficulty: ${difficulty}
    
    Return ONLY JSON:
    {
      "mode": "${mode}",
      "promptText": "string (Vietnamese if mode is VI_TO_JP_SPEAKING, Japanese if mode is JP_TO_JP_SHADOWING)",
      "targetJapaneseText": "string (the ideal Japanese sentence)",
      "vietnameseMeaning": "string (Vietnamese translation)",
      "topic": "${topic}",
      "difficulty": "${difficulty}",
      "grammarFocus": "string",
      "vocabularyFocus": ["string"]
    }`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    return JSON.parse(response.text);
  },

  async evaluateSpeaking(
    mode: SpeakingMode,
    prompt: SpeakingPrompt,
    recognizedText: string
  ): Promise<SpeakingFeedback> {
    const ai = getGenAI();
    if (!ai) throw new Error('API Key not configured');

    const evalPrompt = `Evaluate this Japanese speaking attempt.
    Mode: ${mode}
    Target: ${prompt.targetJapaneseText}
    User said: ${recognizedText}
    
    Instructions:
    1. Feedback MUST BE in Vietnamese.
    2. Be encouraging but precise.
    3. Return ONLY valid JSON.
    
    Return JSON matching this appropriate structure based on mode:
    ${mode === 'VI_TO_JP_SPEAKING' ? 
      `{
        "overallScore": 0, "meaningScore": 0, "grammarScore": 0, "vocabularyScore": 0, "naturalnessScore": 0, "pronunciationScore": 0, "fluencyScore": 0, "completenessScore": 0,
        "overallComment": "...", "meaningFeedback": "...", "grammarFeedback": "...", "vocabularyFeedback": "...", "naturalnessFeedback": "...", "pronunciationFeedback": "...", "fluencyFeedback": "...",
        "suggestedBetterAnswer": "...", "usefulPhrases": [{"japanese": "...", "vietnamese": "..."}], "practiceTips": ["..."]
      }` : 
      `{
        "overallScore": 0, "pronunciationScore": 0, "fluencyScore": 0, "rhythmScore": 0, "intonationScore": 0, "completenessScore": 0,
        "recognizedText": "...", "overallComment": "...", "pronunciationFeedback": "...", "fluencyFeedback": "...", "rhythmFeedback": "...",
        "missingParts": ["..."], "wordFeedback": [{"word": "...", "reading": "...", "issue": "...", "suggestion": "..."}], "practiceTips": ["..."]
      }`
    }`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: evalPrompt,
      config: { responseMimeType: 'application/json' }
    });

    return JSON.parse(response.text);
  },

  async extractTextFromImage(base64Data: string, mimeType: string): Promise<string> {
    const ai = getGenAI();
    if (!ai) throw new Error('API Key not configured');

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash', // Use vision-capable model
      contents: [
        {
          role: 'user',
          parts: [
            { text: "Extract all Japanese and Vietnamese text from this image. Return ONLY the plain text content. If there are multiple sentences, keep them on separate lines. If no text is found, return an empty string." },
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType
              }
            }
          ]
        }
      ]
    });

    return response.text.trim();
  },

  async evaluateTranslation(
    sourceText: string,
    userTranslation: string,
    direction: TranslationDirection
  ): Promise<EvaluationResult> {
    const ai = getGenAI();
    if (!ai) throw new Error('API Key not configured');

    const sourceLang = direction === 'JA_TO_VI' ? 'Japanese' : 'Vietnamese';
    const targetLang = direction === 'JA_TO_VI' ? 'Vietnamese' : 'Japanese';

    const prompt = `You are a Japanese-Vietnamese translation teacher. Evaluate the user's translation carefully.
    
    Context:
    Direction: ${sourceLang} to ${targetLang}
    Source sentence: "${sourceText}"
    User's translation: "${userTranslation}"

    Instructions:
    1. Give a score from 0 to 100 based on meaning accuracy, grammar, vocabulary, and naturalness.
    2. Explain the mistakes in Vietnamese (even if the user translated VI->JA).
    3. Focus on:
       - Meaning accuracy: Did they capture the nuance?
       - Grammar: Particles (for JP), tense, sentence structure.
       - Vocabulary: Was the word choice appropriate for the context?
       - Naturalness: Is it how a native would say it?
    4. Provide one suggested better translation.
    5. List specific corrections in the "corrections" array.
    6. Return ONLY valid JSON matching this schema:
    {
      "score": number,
      "overallComment": "string",
      "accuracyFeedback": "string",
      "grammarFeedback": "string",
      "vocabularyFeedback": "string",
      "naturalnessFeedback": "string",
      "suggestedTranslation": "string",
      "corrections": [
        {
          "userPhrase": "string",
          "betterPhrase": "string",
          "explanation": "string"
        }
      ],
      "explanation": "string (A general explanation in Vietnamese about why this translation is good or bad)"
    }`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });
      
      return JSON.parse(response.text) as EvaluationResult;
    } catch (e) {
      console.error('AI Evaluation failed', e);
      throw new Error('Failed to evaluate translation. Please try again.');
    }
  }
};

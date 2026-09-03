const fs = require('fs');
const pdfParse = require('pdf-parse');
const { GoogleGenAI } = require('@google/genai');

// Initialize Gemini if API key is provided
let ai = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

/**
 * Extracts text from a PDF file.
 */
async function extractTextFromPdf(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    console.error('PDF Parse Error:', error);
    return '';
  }
}

/**
 * RAG Evidence Verification
 * Analyzes the uploaded certificate/report against the student's claimed activity.
 * Returns a confidence score (0-100), reasoning, and detected data.
 */
async function verifyEvidence(activityClaim, filePath) {
  let extractedText = '';
  
  if (filePath && filePath.endsWith('.pdf')) {
    extractedText = await extractTextFromPdf(filePath);
  } else if (filePath) {
    // If it's an image, in a real scenario we'd use Gemini Vision. 
    // We'll simulate OCR for now or pass a message.
    extractedText = "[Image Uploaded - Requires Vision OCR]";
  }

  if (!extractedText.trim()) {
    return {
      confidenceScore: 0,
      reasoning: "No text could be extracted from the evidence.",
      detectedData: {}
    };
  }

  const prompt = `
You are an AI Evidence Verification Assistant for CharactAI.
Your job is to read the text extracted from a student's uploaded certificate or report, and compare it against their claimed activity.

Claimed Activity:
- Title: ${activityClaim.title}
- Category: ${activityClaim.category}
- Role/Achievement: ${activityClaim.role || 'N/A'} / ${activityClaim.achievement || 'N/A'}
- Student Name: ${activityClaim.studentName}

Extracted Text from Evidence Document:
"""
${extractedText.substring(0, 3000)}
"""

Evaluate the match. Provide a JSON response with exactly these fields:
1. confidenceScore: integer from 0 to 100 representing how well the document matches the claim.
2. reasoning: A short sentence explaining why you gave this score.
3. detectedData: An object containing any entities you found in the document (like "studentName", "eventName", "date", "skills").

Respond ONLY with valid JSON.
`;

  try {
    if (ai) {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      return JSON.parse(response.text());
    } else {
      // Mock Fallback if no API key is set
      console.log('No GEMINI_API_KEY set, using mock RAG verification.');
      return {
        confidenceScore: 85,
        reasoning: "Mock: Extracted text appears to loosely match the activity title and student name.",
        detectedData: {
          studentName: activityClaim.studentName,
          keywordsFound: [activityClaim.category]
        }
      };
    }
  } catch (error) {
    console.error('AI Verification Error:', error);
    return {
      confidenceScore: 50,
      reasoning: "Failed to connect to AI for verification. Manual review required.",
      detectedData: {}
    };
  }
}

/**
 * RAG Semantic Search
 * Allows recruiters to search for candidates using natural language.
 */
async function searchCandidates(query, studentsProfiles) {
  // studentsProfiles is an array of objects: { studentId, name, cgpa, activities: [...] }
  
  if (!query || studentsProfiles.length === 0) return [];

  const prompt = `
You are an AI Recruiter Assistant for CharactAI.
A recruiter is searching for students with this query: "${query}"

Here are the profiles of available students (summarized):
${JSON.stringify(studentsProfiles.map(s => ({
  id: s.studentId,
  name: s.name,
  activities: s.activities.slice(0, 10).map(a => a.title) // Limiting to top 10 for prompt size
})), null, 2)}

Analyze the profiles and rank the students who best match the query.
Return a JSON array of objects. Each object should have:
1. studentId
2. matchScore (0-100)
3. reasoning (Why they match the query based on their activities)

Only return students with a matchScore > 40. Sort by matchScore descending.
Respond ONLY with valid JSON.
`;

  try {
    if (ai) {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      return JSON.parse(response.text());
    } else {
      // Mock Fallback
      console.log('No GEMINI_API_KEY set, using mock RAG search.');
      return studentsProfiles.map(s => ({
        studentId: s.studentId,
        matchScore: Math.floor(Math.random() * 40) + 60, // Random 60-99
        reasoning: `Mock: ${s.name} has activities that loosely match '${query}'.`
      })).sort((a, b) => b.matchScore - a.matchScore);
    }
  } catch (error) {
    console.error('AI Search Error:', error);
    return [];
  }
}

module.exports = {
  extractTextFromPdf,
  verifyEvidence,
  searchCandidates
};

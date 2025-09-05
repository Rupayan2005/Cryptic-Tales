// Helper function to extract only important words from a secret message
// Removes articles, prepositions, conjunctions, and other non-essential words

const STOP_WORDS = new Set([
  // Articles
  "a",
  "an",
  "the",

  // Prepositions
  "at",
  "in",
  "on",
  "to",
  "for",
  "of",
  "with",
  "by",
  "from",
  "about",
  "into",
  "through",
  "during",
  "before",
  "after",
  "above",
  "below",
  "up",
  "down",
  "out",
  "off",
  "over",
  "under",
  "again",
  "further",
  "then",
  "once",

  // Conjunctions
  "and",
  "or",
  "but",
  "nor",
  "so",
  "yet",
  "if",
  "because",
  "since",
  "when",
  "where",
  "while",
  "although",
  "though",
  "unless",
  "until",
  "whereas",

  // Pronouns
  "i",
  "you",
  "he",
  "she",
  "it",
  "we",
  "they",
  "me",
  "him",
  "her",
  "us",
  "them",
  "my",
  "your",
  "his",
  "her",
  "its",
  "our",
  "their",
  "mine",
  "yours",
  "hers",
  "ours",
  "theirs",
  "this",
  "that",
  "these",
  "those",
  "who",
  "whom",
  "whose",
  "which",
  "what",

  // Common verbs that are usually not important
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "have",
  "has",
  "had",
  "having",
  "do",
  "does",
  "did",
  "doing",
  "will",
  "would",
  "could",
  "should",
  "may",
  "might",
  "must",
  "can",
  "shall",

  // Other common words
  "very",
  "really",
  "quite",
  "rather",
  "too",
  "also",
  "just",
  "only",
  "even",
  "still",
  "already",
  "yet",
  "soon",
  "here",
  "there",
  "now",
  "then",
  "how",
  "why",
  "yes",
  "no",
  "not",
  "dont",
  "doesn't",
  "didn't",
  "won't",
  "wouldn't",
  "can't",
  "couldn't",
  "shouldn't",
  "mustn't",
]);

export function extractImportantWords(text: string): string[] {
  // Convert to lowercase and split into words
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ") // Replace punctuation with spaces
    .split(/\s+/)
    .filter((word) => word.length > 0);

  // Filter out stop words and keep only meaningful words
  const importantWords = words.filter((word) => {
    // Skip very short words (less than 2 characters)
    if (word.length < 2) return false;

    // Skip stop words
    if (STOP_WORDS.has(word)) return false;

    // Skip pure numbers unless they're part of time/dates
    if (/^\d+$/.test(word) && word.length > 4) return false;

    return true;
  });

  // Remove duplicates while preserving order
  const uniqueWords = [...new Set(importantWords)];

  return uniqueWords;
}

// Create mapping for important words only
export function createImportantWordsMapping(
  originalMapping: Record<string, string>
): Record<string, string> {
  const filteredMapping: Record<string, string> = {};

  Object.entries(originalMapping).forEach(([key, value]) => {
    const importantWords = extractImportantWords(key);

    // If the key contains important words, keep the mapping
    if (importantWords.length > 0) {
      // Use the first important word as the key if the original key is a stop word
      const keyToUse =
        STOP_WORDS.has(key.toLowerCase()) && importantWords.length > 0
          ? importantWords[0]
          : key;

      filteredMapping[keyToUse] = value;
    }
  });

  return filteredMapping;
}

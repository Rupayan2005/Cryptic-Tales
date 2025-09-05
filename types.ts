export type Player = {
  id: string;
  name: string;
  avatar?: string;
  score: number;
  joinedAt: string;
  correctGuesses?: string[]; // Track which words they've guessed correctly
};

export type RoomSettings = {
  timerSeconds: number;
  decayRate: number; // seconds per point decay tick
  difficulty: "easy" | "medium" | "hard";
  allowSuggestions: boolean;
  noTimeLimit: boolean; // If true, next clue appears only when current is solved
};

export type EncryptedMapping = {
  iv: string;
  ciphertext: string;
};

export type Clue = {
  story: string;
  mappingEncrypted: EncryptedMapping;
  createdAt: string;
  basePoints: number;
  originalSecretEncrypted: EncryptedMapping; // Store the encrypted original secret for sentence fill-up
  isCompleted?: boolean; // Track if clue is solved
  timerStartedAt?: string; // When timer started for this clue
};

export type User = {
  id: string;
  username: string;
  passwordHash?: string; // Optional for backwards compatibility
  createdAt: string;
  lastActiveAt: string;
};

export type Room = {
  code: string;
  adminId: string;
  roomKey: string; // never expose to clients
  players: Player[];
  currentClue?: Clue | null;
  clueQueue: Clue[]; // Queue of clues waiting to be revealed
  currentClueIndex: number; // Index of current active clue
  status: "lobby" | "playing" | "ended";
  settings: RoomSettings;
  createdAt: string;
};

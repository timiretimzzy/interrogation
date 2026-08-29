// Core type definitions for "The Interrogation".
// Authored against ENGINE_DESIGN.md. The engine operates only over IDs,
// GatingCondition, and effect edges (reveals/unlocks/createsContradiction).
// It never branches on case content.

// ===== Identifiers & open enums =====
export type CaseId = string;
export type CharacterId = string;
export type QuestionId = string;
export type ClueId = string;
export type FactId = string;
export type EvidenceId = string;
export type ContradictionId = string;
export type StatementId = string;
export type LeadId = string;
/** Context switch id. Engine-extensible; default 'initial'. */
export type ContextId = string;

export type Role =
  | 'suspect' | 'witness' | 'victim' | 'investigator'
  | 'associate' | 'employee' | 'bystander' | 'accomplice' | string;
export type Genre =
  | 'murder' | 'heist' | 'missing_person' | 'fraud' | 'sabotage'
  | 'blackmail' | 'suspicious_death' | 'locked_room' | 'disappearance'
  | 'conspiracy' | string;
export type Tier = 'A' | 'B' | 'C';
export type Difficulty = 'easy' | 'medium' | 'hard';

/**
 * INTERNAL-ONLY classification of a response. NEVER rendered to the player.
 * The engine does not branch on this; it is metadata for generation validation
 * and the redundancy solver (which reasons over `discloses`, not over `kind`).
 */
export type ResponseKind =
  | 'TRUTH' | 'PARTIAL_TRUTH' | 'MISLEADING' | 'DIRECT_LIE'
  | 'EVASIVE' | 'UNCERTAIN' | 'FALSE_BELIEF' | 'ADMISSION'
  | 'DEFLECTION' | 'TRUTH_AFTER_PRESSURE' | string;

/** Card mechanic: engine-relevant classification for grouping/UI only. */
export type CardMechanic =
  | 'TIMELINE' | 'LOCATION' | 'ALIBI' | 'RELATIONSHIP' | 'MOTIVE' | 'OBSERVATION'
  | 'KNOWLEDGE' | 'EVIDENCE' | 'OBJECT' | 'PERSON' | 'EVENT' | 'FOLLOW_UP'
  | 'CONFRONTATION' | 'PRESSURE' | string;

/** Presentation hint only; never a "lying" badge. */
export type Cooperation =
  | 'open' | 'guarded' | 'evasive' | 'deflecting' | 'hostile' | 'revised' | string;

// ===== Case-level =====
export interface Briefing {
  hook: string;
  context?: string;
  tension?: string;
  objective?: string;
}

export interface PlayerRules {
  investigationActions: number;
  switchCharacterIsFree: boolean;
  notebookReviewIsFree: boolean;
  evidenceReviewIsFree: boolean;
  theoryBuildingIsFree: boolean;
  accusationAvailableAtAnyTime: boolean;
  externalKnowledgeRequired: boolean;
  runtimeLLMRequired: boolean;
}

export interface TimelineEvent {
  time: string;
  eventId?: string;
  description: string;
}

export interface Truth {
  incident: string;
  culpritId: CharacterId;
  whatHappened: string;
  motive: string;
  method: string;
  finalLocation?: string;
  timeline: TimelineEvent[];
  criticalFacts: string[];
  importantSecondaryTruths?: string[];
  primaryTwist?: string;
  secondaryTwist?: string;
}

export interface PersonalityProfile {
  cooperation?: 'low' | 'medium' | 'high';
  composure?: 'low' | 'medium' | 'high';
  defensiveness?: 'low' | 'medium' | 'high';
  manipulation?: 'low' | 'medium' | 'high';
  voluntaryDisclosure?: 'low' | 'medium' | 'high';
}

export interface Knowledge {
  knows?: string[];
  doesNotKnow?: string[];
  secrets?: string[];
  lies?: string[];
  beliefs?: string[];
  truthfulStatements?: string[];
  lieMotivation?: string[];
  alibi?: {
    claimed?: string;
    status?: 'true' | 'partial' | 'fabricated' | 'victim' | 'mostlyTrue' | string;
  };
}

export interface Character {
  id: CharacterId;
  name: string;
  role: Role;
  visibleDescription: string;
  personality: string;
  personalityProfile?: PersonalityProfile;
  relationshipIds?: string[];
  knowledge: Knowledge;
  isCulprit?: boolean;
}

export interface Relationship {
  id: string;
  a: CharacterId;
  b: CharacterId;
  type: string;
  description?: string;
  visibility?: 'public' | 'discoverable' | 'secret' | string;
}

export interface Fact {
  id: FactId;
  tier: Tier;
  category: string;
  statement: string;
  critical?: boolean;
}

export interface Evidence {
  id: EvidenceId;
  name: string;
  description: string;
  discoverability: string;
  supports: FactId[];
  optional?: boolean;
}

export interface Clue {
  id: ClueId;
  title: string;
  description: string;
  importance?: 'critical' | 'secondary' | 'atmospheric' | string;
}

export interface Lead {
  id: LeadId;
  title?: string;
  description: string;
}

// ===== Gating (availability + contradiction surfacing) =====
export type GatingAtom =
  | { kind: 'clue'; id: ClueId }
  | { kind: 'evidence'; id: EvidenceId }
  | { kind: 'statement'; id: StatementId }
  | { kind: 'questionAsked'; id: QuestionId }
  | { kind: 'contradictionActive'; id: ContradictionId }
  | { kind: 'context'; id: ContextId };

export interface GatingCondition {
  all?: GatingAtom[];
  any?: GatingAtom[];
}

// ===== Questions / responses =====
export interface FactDisclosure {
  factId: FactId;
  clarity: 'full' | 'partial' | 'none';
}

export interface ResponseVariant {
  id: string;
  text: string;
  kind: ResponseKind;
  cooperation?: Cooperation;
  weight: number;
  requiresContext?: ContextId;
  discloses?: FactDisclosure[];
  reveals?: ClueId[];
  unlocks?: QuestionId[];
  createsContradiction?: ContradictionId;
}

export interface ResolutionContext {
  context: ContextId;
  variants: ResponseVariant[];
}

export interface CaseQuestion {
  id: QuestionId;
  mechanic: CardMechanic;
  text: string;
  targetCharacterIds: CharacterId[];
  availability: { type: 'initial' } | { type: 'unlocked'; when: GatingCondition };
  purpose?: string;
  responses: Record<CharacterId, ResolutionContext[]>;
  reveals?: ClueId[];
  unlocks?: QuestionId[];
}

// ===== Contradictions =====
export interface Contradiction {
  id: ContradictionId;
  type: string;
  description: string;
  statementRefs?: StatementId[];
  surfaceWhen?: GatingCondition;
  importance?: 'critical' | 'high' | 'secondary' | 'low' | string;
  possibleInterpretations?: string[];
  confrontationQuestionId?: QuestionId;
}

export interface Statement {
  id: StatementId;
  characterId: CharacterId;
  sourceQuestionId: QuestionId;
  canonicalMeaning: string;
  truthState: ResponseKind;
}

// ===== Miscs =====
export interface RedHerring {
  id: string;
  characterId?: CharacterId;
  surfaceSuspicion: string;
  actualReason: string;
  crimeConnection: 'unrelated' | 'indirect' | 'none' | string;
  fairnessRole?: string;
}

export interface SolutionPath {
  id: string;
  name: string;
  description: string;
  criticalFacts?: FactId[];
  approximateActions?: number;
}

export interface AccusationOption {
  value: string;
  label?: string;
}

export interface AccusationDimension {
  id: string;
  prompt: string;
  required: boolean;
  options: (string | AccusationOption)[];
  correctValue: string;
}

export interface Accusation {
  dimensions: AccusationDimension[];
  correctSolution: Record<string, string>;
}

export interface RevealFact {
  fact: string;
  importance: string;
  discoveredThrough?: string[];
  howDiscovered?: string;
}

export interface Reveal {
  headline: string;
  narrative: string[];
  truthBreakdown: RevealFact[];
}

export interface CaseFingerprint {
  genre: Genre;
  setting: string;
  crimeStructure: string;
  truthStructure: string;
  narrativeEnvironment: string;
  primaryMechanism: string;
  emotionalTone: string;
  culpritRelationship: string;
  motiveType: string;
  methodType: string;
  nCharacters: number;
  deceptionPattern: string;
  timelineStructure: string;
  endingStructure: string;
}

export interface QualityGates {
  externalKnowledgeRequired: boolean;
  singleExactQuestionSequenceRequired: boolean;
  automaticCandidateEliminationAllowed: boolean;
  runtimeLLMRequired: boolean;
  allCriticalFactsHaveRedundancy: boolean;
  minimumIndependentSolutionPaths: number;
  innocentLiarExists: boolean;
  truthfulSuspiciousCharacterExists: boolean;
  sameQuestionCanProduceDifferentResponses: boolean;
  responseVariabilityCannotChangeCanonicalTruth: boolean;
  responseVariabilityCannotMakeCaseUnsolvable: boolean;
  revealExplainsMajorContradictions: boolean;
  targetPlayTimeMinutes?: { minimum: number; maximum: number };
}

// ===== Top-level CaseFile =====
export interface CaseFile {
  caseId: CaseId;
  date?: string;
  title: string;
  genre: Genre;
  subgenre?: string;
  tone: string;
  setting?: string;
  difficulty: Difficulty;
  estimatedPlayTimeMinutes?: { fast: number; typical: number; deep: number };
  briefing: Briefing;
  playerRules: PlayerRules;
  truth: Truth;
  characters: Character[];
  relationships?: Relationship[];
  facts?: Fact[];
  evidence?: Evidence[];
  clues?: Clue[];
  leads?: Lead[];
  questions: CaseQuestion[];
  statements?: Statement[];
  contradictions: Contradiction[];
  redHerrings?: RedHerring[];
  solutionPaths?: SolutionPath[];
  accusation: Accusation;
  reveal: Reveal;
  fingerprint?: CaseFingerprint;
  qualityGates?: QualityGates;
}

// ===== Player state =====
export interface InterrogationRecord {
  questionId: QuestionId;
  variantId: string;
  text: string;
  contextId: ContextId;
  kind: ResponseKind;
}

export interface PlayerState {
  caseId: CaseId;
  sessionSeed: number;
  attemptNonce: number;
  interrogations: Record<CharacterId, InterrogationRecord[]>;
  recordedStatements: StatementId[];
  discoveredClues: ClueId[];
  discoveredEvidence: EvidenceId[];
  unlockedQuestions: QuestionId[];
  activeContradictions: ContradictionId[];
  flaggedContradictions: ContradictionId[];
  contextSwitches: ContextId[];
  actionsRemaining: number;
  theory?: Record<string, string>;
  accusation?: Record<string, string>;
  status: 'playing' | 'won' | 'lost';
}

export function createInitialPlayerState(
  caseFile: CaseFile,
  sessionSeed: number,
  attemptNonce = 0,
): PlayerState {
  return {
    caseId: caseFile.caseId,
    sessionSeed,
    attemptNonce,
    interrogations: {},
    recordedStatements: [],
    discoveredClues: [],
    discoveredEvidence: [],
    unlockedQuestions: [],
    activeContradictions: [],
    flaggedContradictions: [],
    contextSwitches: ['initial'],
    actionsRemaining: caseFile.playerRules.investigationActions,
    status: 'playing',
  };
}

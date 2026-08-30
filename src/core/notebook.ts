// Notebook projection. A read-only view of PlayerState for the Case Board.
// The engine never computes correctness here; it only surfaces what the player
// has discovered. Contradictions are labelled neutrally ("Possible inconsistency").

import type {
  CaseFile,
  Character,
  Clue,
  Contradiction,
  Evidence,
  PlayerState,
  QuestionId,
} from './types.ts';

export interface CharacterNote {
  id: string;
  name: string;
  role: string;
  description: string;
  personality: string;
  relationships: { type: string; withName: string; description?: string }[];
}

export interface TranscriptEntry {
  characterId: string;
  characterName: string;
  questionId: QuestionId;
  questionText: string;
  responseText: string;
  contextId: string;
}

export interface ContradictionNote {
  id: string;
  description: string;
  possibleInterpretations?: string[];
  importance?: string;
}

export interface LeadNote {
  id: QuestionId;
  text: string;
}

export interface NotebookView {
  people: CharacterNote[];
  transcript: TranscriptEntry[];
  clues: Clue[];
  evidence: Evidence[];
  contradictions: ContradictionNote[];
  leads: LeadNote[];
}

export function buildNotebook(caseFile: CaseFile, state: PlayerState): NotebookView {
  const charById = new Map(caseFile.characters.map((c) => [c.id, c]));

  const people: CharacterNote[] = caseFile.characters.map((c) => ({
    id: c.id,
    name: c.name,
    role: c.role,
    description: c.visibleDescription,
    personality: c.personality,
    relationships: (caseFile.relationships ?? [])
      .filter((r) => r.a === c.id || r.b === c.id)
      .map((r) => {
        const otherId = r.a === c.id ? r.b : r.a;
        const other = charById.get(otherId);
        return { type: r.type, withName: other?.name ?? otherId, description: r.description };
      }),
  }));

  const transcriptRaw: { entry: TranscriptEntry; seq: number }[] = [];
  let fallbackSeq = 0;
  for (const [characterId, records] of Object.entries(state.interrogations)) {
    const character = charById.get(characterId);
    for (const rec of records) {
      const q = caseFile.questions.find((x) => x.id === rec.questionId);
      const recSeq =
        typeof (rec as { sequence?: unknown }).sequence === 'number'
          ? (rec as { sequence: number }).sequence
          : fallbackSeq++;
      transcriptRaw.push({
        seq: recSeq,
        entry: {
          characterId,
          characterName: character?.name ?? characterId,
          questionId: rec.questionId,
          questionText: q?.text ?? rec.questionId,
          responseText: rec.text,
          contextId: rec.contextId,
        },
      });
    }
  }
  // Merge every character's interrogations into ONE chronological transcript,
  // sorted by global interaction sequence (cross-character order preserved).
  const transcript = transcriptRaw
    .sort((a, b) => a.seq - b.seq)
    .map((t) => t.entry);

  const clueById = new Map((caseFile.clues ?? []).map((c) => [c.id, c]));
  const evidenceById = new Map((caseFile.evidence ?? []).map((e) => [e.id, e]));

  const clues = state.discoveredClues
    .map((id) => clueById.get(id))
    .filter((c): c is Clue => Boolean(c));
  const evidence = state.discoveredEvidence
    .map((id) => evidenceById.get(id))
    .filter((e): e is Evidence => Boolean(e));

  const contradictionById = new Map<string, Contradiction>(caseFile.contradictions.map((c) => [c.id, c]));
  const contradictions: ContradictionNote[] = state.activeContradictions
    .map((id) => contradictionById.get(id))
    .filter((c): c is Contradiction => Boolean(c))
    .map((c) => ({
      id: c.id,
      description: c.description,
      possibleInterpretations: c.possibleInterpretations,
      importance: c.importance,
    }));

  // Leads are an investigation map, NOT a copy of the available question list.
  // Derived from characters the player has not yet interviewed plus any
  // case-authored leads (CaseFile.leads). "Leads worth investigating" stays
  // distinct from "Questions I can ask now" (shown per-character on the board).
  const interrogated = new Set(
    Object.keys(state.interrogations).filter(
      (cid) => (state.interrogations[cid]?.length ?? 0) > 0,
    ),
  );
  const leads: LeadNote[] = [];
  for (const l of caseFile.leads ?? []) {
    leads.push({ id: l.id, text: l.title ? `${l.title} — ${l.description}` : l.description });
  }
  for (const c of caseFile.characters) {
    if (!interrogated.has(c.id)) {
      leads.push({
        id: `lead-char-${c.id}`,
        text: `Talk to ${c.name} (${String(c.role).replace(/_/g, ' ')}).`,
      });
    }
  }

  return { people, transcript, clues, evidence, contradictions, leads };
}

export function characterList(caseFile: CaseFile): Character[] {
  return caseFile.characters;
}

import type { CaseFile } from '../../core/types.ts';
import theLastBroadcast from './the-last-broadcast.json';

export const cases: CaseFile[] = [theLastBroadcast as unknown as CaseFile];
export const legacyCases: CaseFile[] = [];

export function getCaseFile(caseId: string): CaseFile | null {
  return cases.find((c) => c.caseId === caseId) ?? null;
}

export default cases;

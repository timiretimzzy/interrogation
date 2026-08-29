// Case registry. Each CaseFile lives in its own module so it can be loaded
// lazily; the runtime never surfaces `truth`. Importing these JSON modules is
// the only place case content enters the engine.

import type { CaseFile } from '../../core/types.ts';
import goldHh001 from './gold-hh-001.json';
import goldVd002 from './gold-vd-002.json';
import synthMpt001 from './synth-mpt-001.json';
import synthCs001 from './synth-cs-001.json';
import goldEx006 from './gold-ex-006.json';
import goldId004 from './gold-id-004.json';
import goldFg007 from './gold-fg-007.json';
import adv001 from './adv-001.json';
import goldSb003 from './gold-sb-003.json';
import goldTc008 from './gold-tc-008.json';
import goldMp009 from './gold-mp-009.json';

export const cases: CaseFile[] = [
  goldHh001 as unknown as CaseFile,
  goldVd002 as unknown as CaseFile,
  synthMpt001 as unknown as CaseFile,
  synthCs001 as unknown as CaseFile,
  goldEx006 as unknown as CaseFile,
  goldId004 as unknown as CaseFile,
  goldFg007 as unknown as CaseFile,
  adv001 as unknown as CaseFile,
  goldSb003 as unknown as CaseFile,
  goldTc008 as unknown as CaseFile,
  goldMp009 as unknown as CaseFile,
];

export function getCaseFile(caseId: string): CaseFile | null {
  return cases.find((c) => c.caseId === caseId) ?? null;
}

export default cases;

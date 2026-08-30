import fs from 'fs';
const caseData = JSON.parse(fs.readFileSync('src/data/cases/gold-ex-006.json', 'utf8'));

let totalVariants = 0;
caseData.questions.forEach(q => {
  const resp = q.responses;
  Object.values(resp).forEach(charResps => {
    if (Array.isArray(charResps)) {
      charResps.forEach(cr => {
        if (cr.variants && Array.isArray(cr.variants)) totalVariants += cr.variants.length;
        else totalVariants++;
      });
    }
  });
});
console.log('Response variants:', totalVariants);

// Count question-level unlocks
let totalUnlocks = 0;
caseData.questions.forEach(q => {
  if (q.unlocks && Array.isArray(q.unlocks)) totalUnlocks += q.unlocks.length;
});
console.log('Question-level unlocks:', totalUnlocks);

// Count reveals
let totalReveals = 0;
caseData.questions.forEach(q => {
  if (q.reveals && Array.isArray(q.reveals)) totalReveals += q.reveals.length;
});
console.log('Reveal entries:', totalReveals);

// Count discloses
let totalDiscloses = 0;
caseData.questions.forEach(q => {
  if (q.discloses && Array.isArray(q.discloses)) totalDiscloses += q.discloses.length;
});
console.log('Disclose entries:', totalDiscloses);

// Response kind distribution
const kinds = {};
caseData.questions.forEach(q => {
  Object.values(q.responses).forEach(charResps => {
    if (Array.isArray(charResps)) {
      charResps.forEach(cr => {
        const kind = cr.kind || 'unknown';
        kinds[kind] = (kinds[kind] || 0) + 1;
      });
    }
  });
});
console.log('Response kinds:', kinds);

// Timeline
console.log('Timeline events:', caseData.truth.timeline.length);
console.log('Critical facts:', caseData.truth.criticalFacts.length);
console.log('Secondary truths:', caseData.truth.importantSecondaryTruths.length);
console.log('Facts tier A:', caseData.facts.filter(f => f.tier === 'A').length);
console.log('Facts tier B:', caseData.facts.filter(f => f.tier === 'B').length);
console.log('Facts tier C:', caseData.facts.filter(f => f.tier === 'C').length);
const fs = require('fs');
const path = require('path');

const leaderboardPath = path.join(__dirname, '..', 'app', '(tabs)', 'leaderboard.tsx');
const source = fs.readFileSync(leaderboardPath, 'utf8');

function parseArrayConstants(text) {
  const arrayConstRegex = /const\s+([A-Z0-9_]+_FEDERATION_OPTIONS)\s*=\s*\[([\s\S]*?)\](?:\s*;)?/g;
  const constants = new Map();

  let match;
  while ((match = arrayConstRegex.exec(text)) !== null) {
    const [, name, arrayBody] = match;
    const values = [];
    const stringRegex = /'((?:\\'|[^'])*)'/g;
    let valueMatch;

    while ((valueMatch = stringRegex.exec(arrayBody)) !== null) {
      values.push(valueMatch[1]);
    }

    constants.set(name, values);
  }

  return constants;
}

function parseFederationGroups(text) {
  const groupsBlockMatch = text.match(/const\s+FEDERATION_GROUPS\s*=\s*\[([\s\S]*?)\]\s*as\s*const;/);
  if (!groupsBlockMatch) {
    throw new Error('Could not find FEDERATION_GROUPS block.');
  }

  const groupsBlock = groupsBlockMatch[1];
  const groupRegex = /\{\s*key:\s*'([^']+)'\s*,\s*label:\s*'([^']+)'\s*,\s*options:\s*([A-Z0-9_]+_FEDERATION_OPTIONS)\s*\}/g;
  const groups = [];

  let groupMatch;
  while ((groupMatch = groupRegex.exec(groupsBlock)) !== null) {
    const [, key, label, optionsConst] = groupMatch;
    groups.push({ key, label, optionsConst });
  }

  return groups;
}

function isAggregateOption(name) {
  return /^all\b/i.test(name) || /^all\s+tested\b/i.test(name);
}

const federationConstants = parseArrayConstants(source);
const federationGroups = parseFederationGroups(source);

const missingOptionConstants = federationGroups
  .map((group) => group.optionsConst)
  .filter((optionsConst) => !federationConstants.has(optionsConst));

if (missingOptionConstants.length > 0) {
  throw new Error(
    `FEDERATION_GROUPS references missing constants: ${missingOptionConstants.join(', ')}`
  );
}

const allGroupOptions = federationGroups.flatMap((group) => federationConstants.get(group.optionsConst));
const uniqueAllGroupOptions = new Set(allGroupOptions);

const specificFederations = allGroupOptions.filter((name) => !isAggregateOption(name));
const uniqueSpecificFederations = new Set(specificFederations);

const nonNationGroupKeys = new Set(['international', 'regional']);
const nationGroups = federationGroups.filter((group) => !nonNationGroupKeys.has(group.key));

console.log('Federation Counting Summary');
console.log('--------------------------');
console.log(`Federation groups configured: ${federationGroups.length}`);
console.log(`Nation groups (excluding International/Regional): ${nationGroups.length}`);
console.log(`Total federation options across groups: ${allGroupOptions.length}`);
console.log(`Unique federation options across groups: ${uniqueAllGroupOptions.size}`);
console.log(`Specific federation options (excludes All/All Tested entries): ${specificFederations.length}`);
console.log(`Unique specific federation options: ${uniqueSpecificFederations.size}`);

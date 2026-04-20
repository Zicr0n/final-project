import fs from 'fs';

const words = fs
	.readFileSync('words.txt', 'utf-8')
	.split('\n')
	.map((w) => w.trim().toLowerCase())
	.filter(Boolean);

const cleanWords = words.filter((w) => w.length >= 3 && /^[a-z]+$/.test(w));

function buildPromptMap(words, minLen = 2, maxLen = 3) {
	const promptMap = new Map();

	for (const word of words) {
		for (let len = minLen; len <= maxLen; len++) {
			for (let i = 0; i <= word.length - len; i++) {
				const prompt = word.slice(i, i + len);

				if (!promptMap.has(prompt)) {
					promptMap.set(prompt, new Set());
				}

				promptMap.get(prompt).add(word);
			}
		}
	}

	return promptMap;
}

const prompts = buildPromptMap(cleanWords);

function promptCounts(promptMap) {
	return [...promptMap.entries()].map(([prompt, words]) => ({
		prompt,
		count: words.size
	}));
}

let counts = promptCounts(prompts);

counts = counts.sort((a, b) => b.count - a.count);
console.log(counts);

fs.writeFileSync('prompts.json', JSON.stringify(counts, null, 2));

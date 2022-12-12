import parser from './parser';
import { writeFileSync } from 'fs';
const path = 'scripts/tutorial.masoria';

const script = parser(path);

writeFileSync('output/tutorial.json', JSON.stringify(script, null, 2));

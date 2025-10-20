import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

let failures = 0;

function pass(message) {
  console.log(`✅ ${message}`);
}

function fail(message) {
  console.error(`❌ ${message}`);
  failures += 1;
}

async function readJSON(relativePath) {
  const absolute = path.join(root, relativePath);
  const raw = await fs.readFile(absolute, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`Unable to parse ${relativePath}: ${err.message}`);
  }
}

async function ensureFileExists(relativePath) {
  const absolute = path.join(root, relativePath);
  try {
    await fs.access(absolute);
    return true;
  } catch (err) {
    fail(`${relativePath} is missing (${err.message})`);
    return false;
  }
}

async function checkQuestionBank() {
  try {
    const questions = await readJSON('data/qbank.json');
    if (!Array.isArray(questions)) {
      fail('Question bank must be an array');
      return;
    }
    pass(`Loaded ${questions.length} questions`);
    questions.forEach((question, index) => {
      const prefix = `Question ${index + 1}`;
      if (typeof question.stem !== 'string' || !question.stem.trim()) {
        fail(`${prefix}: stem must be a non-empty string`);
      }
      if (!Array.isArray(question.choices) || question.choices.length < 2) {
        fail(`${prefix}: choices must contain at least two options`);
      } else if (!question.choices.every(choice => typeof choice === 'string' && choice.trim())) {
        fail(`${prefix}: every choice must be a non-empty string`);
      }
      if (!Number.isInteger(question.answer_index) || question.answer_index < 0 || question.answer_index >= (question.choices?.length || 0)) {
        fail(`${prefix}: answer_index must reference a valid choice`);
      }
      if (typeof question.explanation !== 'string' || !question.explanation.trim()) {
        fail(`${prefix}: explanation must be provided`);
      }
    });
  } catch (err) {
    fail(err.message);
  }
}

async function checkCxrDataset() {
  try {
    const dataset = await readJSON('data/cxr_tasks.json');
    if (typeof dataset !== 'object' || dataset === null) {
      fail('CXR dataset must be an object');
      return;
    }
    if (typeof dataset.image !== 'string' || !dataset.image.trim()) {
      fail('CXR dataset must include an image path');
    } else {
      await ensureFileExists(dataset.image.trim());
    }
    if (!Array.isArray(dataset.targets) || dataset.targets.length === 0) {
      fail('CXR dataset must provide at least one target');
    } else {
      dataset.targets.forEach((target, index) => {
        const prefix = `Target ${index + 1}`;
        ['name', 'hint'].forEach((key) => {
          if (typeof target[key] !== 'string' || !target[key].trim()) {
            fail(`${prefix}: ${key} must be a non-empty string`);
          }
        });
        ['cx', 'cy', 'r'].forEach((key) => {
          if (!Number.isFinite(target[key]) || target[key] < 0) {
            fail(`${prefix}: ${key} must be a non-negative number`);
          }
        });
      });
    }
  } catch (err) {
    fail(err.message);
  }
}

async function checkManifest() {
  try {
    const manifest = await readJSON('manifest.webmanifest');
    if (typeof manifest.name !== 'string' || !manifest.name.trim()) {
      fail('Manifest must include a name');
    }
    if (typeof manifest.short_name !== 'string' || !manifest.short_name.trim()) {
      fail('Manifest must include a short_name');
    }
    if (!Array.isArray(manifest.icons) || manifest.icons.length === 0) {
      fail('Manifest must define at least one icon');
    } else {
      await Promise.all(manifest.icons.map(async (icon, index) => {
        if (typeof icon.src !== 'string' || !icon.src.trim()) {
          fail(`Manifest icon ${index + 1} is missing a src`);
          return;
        }
        const exists = await ensureFileExists(icon.src.trim());
        if (exists) {
          pass(`Manifest icon available: ${icon.src}`);
        }
      }));
    }
  } catch (err) {
    fail(err.message);
  }
}

async function main() {
  await checkQuestionBank();
  await checkCxrDataset();
  await checkManifest();

  if (failures > 0) {
    console.error(`\n${failures} validation issue(s) detected.`);
    process.exitCode = 1;
    return;
  }

  console.log('\nAll repository content checks passed.');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

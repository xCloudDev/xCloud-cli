import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

export function isInteractive() {
  return Boolean(process.stdin.isTTY && process.stdout.isTTY);
}

export async function confirmDangerous(message, yes) {
  if (yes) return true;
  if (!isInteractive()) return false;
  const rl = readline.createInterface({ input, output });
  try {
    const answer = await rl.question(`${message} Type yes to continue: `);
    return answer.trim().toLowerCase() === 'yes';
  } finally {
    rl.close();
  }
}

#!/usr/bin/env bun
/**
 * Veraxe — Agent IA CLI
 * Stack : Bun + TypeScript + Groq + Tavily
 *
 * Usage:
 *   bun run src/index.ts generate <topic> [--tone <tone>]
 *   bun run src/index.ts search <query>
 *   bun run src/index.ts post <content>
 *   bun run src/index.ts init
 *   bun run src/index.ts help
 */

import { parseArgs, runCommand } from "./cli/commands.js";

const args = process.argv.slice(2);
const cmd = parseArgs(args);
runCommand(cmd);

#!/usr/bin/env node

import * as p from "@clack/prompts";
import { cp, mkdir, readdir, readFile, rename, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const templateRoot = path.join(packageRoot, "templates", "dual-electron");

function parseArguments(argv) {
  const result = { directory: undefined, name: undefined, rendererDir: undefined, devUrl: undefined, packageManager: undefined, yes: false };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--help" || argument === "-h") return { help: true };
    if (argument === "--yes" || argument === "-y") { result.yes = true; continue; }
    if (["--name", "--renderer-dir", "--dev-url", "--package-manager"].includes(argument)) {
      const value = argv[++index];
      if (!value || value.startsWith("-")) throw new Error(`Missing value for ${argument}`);
      result[{ "--name": "name", "--renderer-dir": "rendererDir", "--dev-url": "devUrl", "--package-manager": "packageManager" }[argument]] = value;
      continue;
    }
    if (argument.startsWith("-")) throw new Error(`Unknown option: ${argument}`);
    if (result.directory) throw new Error("Only one project directory can be provided");
    result.directory = argument;
  }
  return result;
}

function printHelp() {
  console.log(`\nUsage: create-dual-electron [project-directory] [options]\n\nOptions:\n  --name <name>                 Package name\n  --renderer-dir <path>         Relative or absolute DualVite project directory\n  --dev-url <url>               Renderer Vite URL for development\n  --package-manager <manager>   pnpm, npm, yarn, or bun\n  --yes, -y                     Use defaults without prompts\n  --help, -h                    Show this help\n`);
}

function packageName(value) { return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""); }
function isHttpUrl(value) { try { return ["http:", "https:"].includes(new URL(value).protocol); } catch { return false; } }
async function directoryIsEmpty(directory) { try { return (await readdir(directory)).length === 0; } catch (error) { if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") return true; throw error; } }
function cancelIfNeeded(value) { if (p.isCancel(value)) { p.cancel("Creation cancelled."); process.exit(0); } return value; }

async function replaceTokens(directory, values) {
  const entries = await readdir(directory, { withFileTypes: true });
  await Promise.all(entries.map(async (entry) => {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return replaceTokens(filePath, values);
    const source = await readFile(filePath, "utf8");
    await writeFile(filePath, Object.entries(values).reduce((text, [token, value]) => text.replaceAll(token, value), source));
  }));
}

function installDependencies(manager, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(manager, ["install"], { cwd, stdio: "inherit", shell: process.platform === "win32" });
    child.on("error", reject);
    child.on("exit", (code) => code === 0 ? resolve() : reject(new Error(`${manager} install exited with code ${code}`)));
  });
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) return printHelp();
  p.intro("create-dual-electron");
  const rawName = options.name || options.directory || (options.yes ? "dual-electron-app" : cancelIfNeeded(await p.text({ message: "Desktop project name", placeholder: "my-desktop-app", validate: (value) => packageName(value) ? undefined : "Use letters or numbers in the project name." })));
  const name = packageName(rawName);
  const targetDirectory = path.resolve(process.cwd(), options.directory || name);
  const rendererDir = options.rendererDir || (options.yes ? "../dual-vite-app" : cancelIfNeeded(await p.text({ message: "DualVite renderer directory", initialValue: "../dual-vite-app", validate: (value) => value.trim() ? undefined : "Renderer directory is required." })));
  const devUrl = options.devUrl || (options.yes ? "http://127.0.0.1:5173/" : cancelIfNeeded(await p.text({ message: "DualVite development URL", initialValue: "http://127.0.0.1:5173/", validate: (value) => isHttpUrl(value) ? undefined : "Use an http:// or https:// URL." })));
  const manager = options.packageManager || (options.yes ? "pnpm" : cancelIfNeeded(await p.select({ message: "Package manager", initialValue: "pnpm", options: ["pnpm", "npm", "yarn", "bun"].map((value) => ({ value, label: value })) })));
  if (!name) throw new Error("Package name must contain letters or numbers");
  if (!(await directoryIsEmpty(targetDirectory))) throw new Error(`Target directory is not empty: ${targetDirectory}`);

  const progress = p.spinner();
  progress.start("Generating Electron shell");
  await mkdir(targetDirectory, { recursive: true });
  await cp(templateRoot, targetDirectory, { recursive: true });
  await replaceTokens(targetDirectory, { "__APP_NAME__": name, "__RENDERER_DIR__": rendererDir, "__DEV_URL__": devUrl });
  await rename(path.join(targetDirectory, "_gitignore"), path.join(targetDirectory, ".gitignore"));
  progress.stop("Electron shell generated");

  const shouldInstall = options.yes ? false : cancelIfNeeded(await p.confirm({ message: `Install dependencies with ${manager}?`, initialValue: true }));
  if (shouldInstall) { progress.start("Installing dependencies"); try { await installDependencies(manager, targetDirectory); progress.stop("Dependencies installed"); } catch (error) { progress.stop("Dependency installation failed"); throw error; } }
  const relativeTarget = path.relative(process.cwd(), targetDirectory) || ".";
  p.note(`cd ${relativeTarget}\n${shouldInstall ? "" : `${manager} install\n`}${manager} start\n\nStart DualVite separately at ${devUrl}\n${manager} build:renderer\n${manager} start:filelocal`, "Next steps");
  p.outro("DualElectron is ready.");
}

main().catch((error) => { p.log.error(error.message); process.exitCode = 1; });

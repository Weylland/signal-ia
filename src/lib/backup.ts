import path from "node:path";
import { mkdirSync, readdirSync, statSync, unlinkSync } from "node:fs";
import { getDb } from "./db";

// Nombre de snapshots conservés (rotation)
const KEEP = 14;

function dbPath(): string {
  return process.env.DATABASE_PATH ?? path.join(process.cwd(), "database.sqlite");
}

export function backupDir(): string {
  return path.join(path.dirname(dbPath()), "backups");
}

export function listAllBackups(): { file: string; mtime: number; size: number }[] {
  const dir = backupDir();
  try {
    return readdirSync(dir)
      .filter((f) => f.startsWith("backup-") && f.endsWith(".sqlite"))
      .map((f) => {
        const st = statSync(path.join(dir, f));
        return { file: f, mtime: st.mtimeMs, size: st.size };
      })
      .sort((a, b) => b.mtime - a.mtime);
  } catch {
    return [];
  }
}

function listBackups(dir: string): { file: string; mtime: number }[] {
  try {
    return readdirSync(dir)
      .filter((f) => f.startsWith("backup-") && f.endsWith(".sqlite"))
      .map((f) => ({ file: f, mtime: statSync(path.join(dir, f)).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime);
  } catch {
    return [];
  }
}

/** Crée un snapshot SQLite cohérent (online backup) et applique la rotation. */
export async function runBackup(): Promise<string> {
  const dir = backupDir();
  mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dest = path.join(dir, `backup-${stamp}.sqlite`);

  // better-sqlite3 : backup() est un snapshot cohérent même si la base est en cours d'écriture
  await getDb().backup(dest);

  for (const { file } of listBackups(dir).slice(KEEP)) {
    try {
      unlinkSync(path.join(dir, file));
    } catch {
      /* ignore */
    }
  }
  return dest;
}

export function latestBackup(): string | null {
  const dir = backupDir();
  const [first] = listBackups(dir);
  return first ? path.join(dir, first.file) : null;
}

export function backupCount(): number {
  return listBackups(backupDir()).length;
}

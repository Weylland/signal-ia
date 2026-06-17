import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import type { JSONRPCMessage } from "@modelcontextprotocol/sdk/types.js";
import { marked } from "marked";
import {
  getAllArticles,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle,
  getStats,
} from "./articles";
import { getGlossary, upsertGlossaryEntry, deleteGlossaryEntry } from "./glossary";
import { getSources, addSource, updateSource, deleteSource } from "./sources";
import { getSubscribers } from "./newsletter";
import { getSettings, saveSettings } from "./settings";
import { getDb } from "./db";
import { runPipeline } from "../../pipeline/run";

const encoder = new TextEncoder();

export class NextJsTransport implements Transport {
  onmessage?: (message: JSONRPCMessage) => void;
  onclose?: () => void;
  onerror?: (error: Error) => void;

  constructor(private controller: ReadableStreamDefaultController<Uint8Array>) {}

  async start(): Promise<void> {}

  async send(message: JSONRPCMessage): Promise<void> {
    const data = `event: message\ndata: ${JSON.stringify(message)}\n\n`;
    this.controller.enqueue(encoder.encode(data));
  }

  async close(): Promise<void> {
    try { this.controller.close(); } catch {}
  }

  handleIncoming(raw: unknown): void {
    this.onmessage?.(raw as JSONRPCMessage);
  }
}

export function createMcpServer() {
  const server = new Server(
    { name: "signal-ia", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "list_articles",
        description: "Liste les articles du site signal·ia",
        inputSchema: {
          type: "object",
          properties: {
            limit: { type: "number", description: "Nombre max (défaut 20)" },
            type: { type: "string", enum: ["news", "tuto"] },
            include_drafts: { type: "boolean" },
          },
        },
      },
      {
        name: "get_article",
        description: "Récupère un article complet par son slug",
        inputSchema: {
          type: "object",
          required: ["slug"],
          properties: { slug: { type: "string" } },
        },
      },
      {
        name: "create_article",
        description: "Crée un article (actualité ou tutoriel) sur signal·ia",
        inputSchema: {
          type: "object",
          required: ["title", "content", "type"],
          properties: {
            title: { type: "string" },
            content: { type: "string", description: "Contenu en Markdown" },
            type: { type: "string", enum: ["news", "tuto"] },
            excerpt: { type: "string", description: "Résumé court (1 phrase)" },
            tags: { type: "array", items: { type: "string" } },
            tldr: { type: "array", items: { type: "string" }, description: "3 points clés max" },
            image: { type: "string", description: "URL image de couverture" },
            published: { type: "boolean", description: "Publier immédiatement (défaut true)" },
            difficulty: { type: "string", enum: ["debutant", "intermediaire", "avance"], description: "Niveau (tutos uniquement)" },
          },
        },
      },
      {
        name: "update_article",
        description: "Met à jour un article existant",
        inputSchema: {
          type: "object",
          required: ["slug"],
          properties: {
            slug: { type: "string" },
            title: { type: "string" },
            content: { type: "string", description: "Contenu en Markdown" },
            excerpt: { type: "string" },
            tags: { type: "array", items: { type: "string" } },
            tldr: { type: "array", items: { type: "string" } },
            image: { type: "string" },
            published: { type: "boolean" },
            difficulty: { type: "string", enum: ["debutant", "intermediaire", "avance"], description: "Niveau (tutos uniquement)" },
          },
        },
      },
      {
        name: "delete_article",
        description: "Supprime définitivement un article",
        inputSchema: {
          type: "object",
          required: ["slug"],
          properties: { slug: { type: "string" } },
        },
      },
      {
        name: "list_glossary",
        description: "Liste tous les termes du glossaire IA",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "create_glossary_entry",
        description: "Ajoute un terme au glossaire",
        inputSchema: {
          type: "object",
          required: ["term", "definition"],
          properties: {
            term: { type: "string" },
            definition: { type: "string", description: "Définition en Markdown" },
          },
        },
      },
      {
        name: "update_glossary_entry",
        description: "Met à jour un terme du glossaire",
        inputSchema: {
          type: "object",
          required: ["id", "definition"],
          properties: {
            id: { type: "number" },
            term: { type: "string" },
            definition: { type: "string", description: "Définition en Markdown" },
          },
        },
      },
      {
        name: "delete_glossary_entry",
        description: "Supprime un terme du glossaire",
        inputSchema: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "number" } },
        },
      },
      {
        name: "list_sources",
        description: "Liste les sources RSS configurées",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "add_source",
        description: "Ajoute une source RSS au pipeline",
        inputSchema: {
          type: "object",
          required: ["name", "url"],
          properties: {
            name: { type: "string" },
            url: { type: "string", description: "URL du flux RSS" },
          },
        },
      },
      {
        name: "toggle_source",
        description: "Active ou désactive une source RSS",
        inputSchema: {
          type: "object",
          required: ["id", "active"],
          properties: {
            id: { type: "number" },
            active: { type: "boolean" },
          },
        },
      },
      {
        name: "delete_source",
        description: "Supprime une source RSS",
        inputSchema: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "number" } },
        },
      },
      {
        name: "get_analytics",
        description: "Statistiques du site : vues, articles, abonnés, top articles",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "list_subscribers",
        description: "Liste les abonnés à la newsletter",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "list_pending",
        description: "Liste les news en attente de modération",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "approve_article",
        description: "Approuve un article en attente de modération",
        inputSchema: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "number" } },
        },
      },
      {
        name: "reject_article",
        description: "Rejette un article en attente de modération",
        inputSchema: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "number" } },
        },
      },
      {
        name: "get_pipeline_status",
        description: "Statut du dernier passage du pipeline",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "trigger_pipeline",
        description: "Lance le pipeline manuellement (fetch RSS + rédaction articles)",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "get_settings",
        description: "Récupère les réglages du site",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "update_settings",
        description: "Met à jour les réglages du site",
        inputSchema: {
          type: "object",
          properties: {
            siteTitle: { type: "string" },
            siteDescription: { type: "string" },
            maxArticlesPerDay: { type: "number" },
            maxArticlesPerRun: { type: "number" },
            queueThreshold: { type: "number" },
            breakingThreshold: { type: "number" },
            requireApproval: { type: "boolean" },
            blacklistKeywords: { type: "string" },
            blacklistDomains: { type: "string" },
          },
        },
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args = {} } = request.params;

    try {
      switch (name) {
        case "list_articles": {
          const articles = await getAllArticles({
            includeDrafts: args.include_drafts === true,
            type: args.type as "news" | "tuto" | undefined,
          });
          const limited = articles.slice(0, (args.limit as number) ?? 20);
          return ok(limited.map((a) => ({
            slug: a.slug, title: a.title, type: a.type,
            published: a.published, date: a.date, views: a.views, tags: a.tags,
          })));
        }

        case "get_article": {
          const article = await getArticle(args.slug as string, { includeDrafts: true });
          if (!article) return err(`Article "${args.slug}" introuvable`);
          return ok(article);
        }

        case "create_article": {
          const html = await marked.parse((args.content as string).trim());
          const slug = await createArticle({
            title: args.title as string,
            excerpt: (args.excerpt as string) ?? "",
            html,
            type: (args.type as "news" | "tuto") ?? "news",
            tags: (args.tags as string[]) ?? [],
            tldr: (args.tldr as string[]) ?? [],
            image: (args.image as string) ?? null,
            published: args.published !== false,
            difficulty: (args.difficulty as string) ?? null,
            sources: [],
          });
          return ok({ slug, url: `/articles/${slug}` });
        }

        case "update_article": {
          const existing = await getArticle(args.slug as string, { includeDrafts: true });
          if (!existing) return err(`Article "${args.slug}" introuvable`);
          const html = args.content
            ? await marked.parse((args.content as string).trim())
            : existing.html;
          await updateArticle(args.slug as string, {
            title: (args.title as string) ?? existing.title,
            excerpt: (args.excerpt as string) ?? existing.excerpt,
            html,
            type: existing.type,
            tags: (args.tags as string[]) ?? existing.tags,
            tldr: (args.tldr as string[]) ?? existing.tldr,
            image: (args.image as string) ?? existing.image,
            published: args.published !== undefined ? (args.published as boolean) : existing.published,
            difficulty: (args.difficulty as string) ?? existing.difficulty,
          });
          return ok({ slug: args.slug });
        }

        case "delete_article": {
          await deleteArticle(args.slug as string);
          return ok({ deleted: args.slug });
        }

        case "list_glossary": {
          return ok(getGlossary().map((e) => ({ id: e.id, slug: e.slug, term: e.term })));
        }

        case "create_glossary_entry": {
          const html = await marked.parse((args.definition as string).trim());
          upsertGlossaryEntry(args.term as string, html);
          return ok({ term: args.term });
        }

        case "update_glossary_entry": {
          const html = await marked.parse((args.definition as string).trim());
          upsertGlossaryEntry(
            (args.term as string) ?? getGlossary().find((e) => e.id === args.id)?.term ?? "",
            html,
            args.id as number
          );
          return ok({ id: args.id });
        }

        case "delete_glossary_entry": {
          deleteGlossaryEntry(args.id as number);
          return ok({ deleted: args.id });
        }

        case "list_sources": {
          return ok(getSources());
        }

        case "add_source": {
          addSource(args.name as string, args.url as string);
          return ok({ added: args.name });
        }

        case "toggle_source": {
          updateSource(args.id as number, { active: args.active as boolean });
          return ok({ id: args.id, active: args.active });
        }

        case "delete_source": {
          deleteSource(args.id as number);
          return ok({ deleted: args.id });
        }

        case "get_analytics": {
          const db = getDb();
          const stats = await getStats();
          const topArticles = db
            .prepare("SELECT slug, title, views FROM articles WHERE published = 1 ORDER BY views DESC LIMIT 10")
            .all();
          const subscribers = getSubscribers().length;
          return ok({ stats, topArticles, subscribers });
        }

        case "list_subscribers": {
          return ok(getSubscribers());
        }

        case "list_pending": {
          const db = getDb();
          const rows = db
            .prepare("SELECT id, title, url, source_name, score, status, seen_at FROM pending_news WHERE status IN ('queued','new') ORDER BY score DESC LIMIT 30")
            .all();
          return ok(rows);
        }

        case "approve_article": {
          const db = getDb();
          db.prepare("UPDATE pending_news SET status = 'approved' WHERE id = ?").run(args.id);
          return ok({ approved: args.id });
        }

        case "reject_article": {
          const db = getDb();
          db.prepare("UPDATE pending_news SET status = 'rejected' WHERE id = ?").run(args.id);
          return ok({ rejected: args.id });
        }

        case "get_pipeline_status": {
          const db = getDb();
          const run = db
            .prepare("SELECT started_at, finished_at, status, items_new, articles_created, log FROM pipeline_runs ORDER BY id DESC LIMIT 1")
            .get();
          return ok(run ?? { status: "never_run" });
        }

        case "trigger_pipeline": {
          runPipeline().catch((e: unknown) => console.error("[mcp] pipeline error:", e));
          return ok({ message: "Pipeline lancé en arrière-plan." });
        }

        case "get_settings": {
          return ok(getSettings());
        }

        case "update_settings": {
          saveSettings(args as Parameters<typeof saveSettings>[0]);
          return ok({ saved: true });
        }

        default:
          return err(`Outil inconnu : ${name}`);
      }
    } catch (e) {
      return err(e instanceof Error ? e.message : String(e));
    }
  });

  return server;
}

function ok(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function err(message: string) {
  return { content: [{ type: "text" as const, text: `Erreur : ${message}` }], isError: true };
}

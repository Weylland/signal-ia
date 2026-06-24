import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { marked } from "marked";
import {
  getAllArticles,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle,
  setArticleTranslation,
  searchArticlesFts,
  getAllTags,
  renameTag,
  deleteTag,
  getStats,
} from "./articles";
import { autoTranslateArticle } from "./translate";
import { publishPendingItem, rejectPendingItem } from "./moderation";
import { getGlossary, upsertGlossaryEntry, deleteGlossaryEntry } from "./glossary";
import { getSources, addSource, updateSource, deleteSource } from "./sources";
import { getSubscribers } from "./newsletter";
import { getSettings, saveSettings } from "./settings";
import { getDb } from "./db";
import { getAnalytics } from "./analytics";
import { runPipeline } from "../../pipeline/run";

const EN_FIELDS = {
  title_en: { type: "string", description: "Titre en anglais" },
  excerpt_en: { type: "string", description: "Chapeau en anglais" },
  tldr_en: { type: "array", items: { type: "string" }, description: "Points clés en anglais" },
  content_en: { type: "string", description: "Corps en anglais (Markdown)" },
} as const;

/**
 * Enregistre la version EN d'un article si au moins un champ EN est fourni.
 * Les champs absents retombent sur l'EN existant, puis sur le FR — pour ne
 * jamais écraser une traduction partielle déjà en place.
 */
async function applyTranslation(
  slug: string,
  args: Record<string, unknown>
): Promise<boolean> {
  const hasEn =
    args.title_en !== undefined ||
    args.excerpt_en !== undefined ||
    args.tldr_en !== undefined ||
    args.content_en !== undefined;
  if (!hasEn) return false;

  const article = await getArticle(slug, { includeDrafts: true });
  if (!article) return false;

  const html = args.content_en
    ? await marked.parse((args.content_en as string).trim())
    : article.htmlEn ?? article.html;

  setArticleTranslation(slug, {
    title: (args.title_en as string) ?? article.titleEn ?? article.title,
    excerpt: (args.excerpt_en as string) ?? article.excerptEn ?? article.excerpt,
    html,
    tldr: (args.tldr_en as string[]) ?? (article.tldrEn.length > 0 ? article.tldrEn : article.tldr),
  });
  return true;
}

export function createMcpServer() {
  const server = new Server(
    { name: "watch-ia", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "list_articles",
        description: "Liste les articles du site watch·ia",
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
        description: "Crée un article (actualité ou tutoriel) sur watch·ia. Le corps Markdown peut contenir du HTML/SVG brut (schémas).",
        inputSchema: {
          type: "object",
          required: ["title", "content", "type"],
          properties: {
            title: { type: "string" },
            content: { type: "string", description: "Contenu en Markdown (HTML/SVG brut accepté)" },
            type: { type: "string", enum: ["news", "tuto"] },
            excerpt: { type: "string", description: "Résumé court (1 phrase)" },
            tags: { type: "array", items: { type: "string" } },
            tldr: { type: "array", items: { type: "string" }, description: "3 points clés max" },
            image: { type: "string", description: "URL image de couverture" },
            published: { type: "boolean", description: "Publier immédiatement (défaut true)" },
            difficulty: { type: "string", enum: ["debutant", "intermediaire", "avance"], description: "Niveau (tutos uniquement)" },
            ...EN_FIELDS,
          },
        },
      },
      {
        name: "update_article",
        description: "Met à jour un article existant (FR et/ou EN). Seuls les champs fournis sont modifiés.",
        inputSchema: {
          type: "object",
          required: ["slug"],
          properties: {
            slug: { type: "string" },
            title: { type: "string" },
            content: { type: "string", description: "Contenu en Markdown (HTML/SVG brut accepté)" },
            excerpt: { type: "string" },
            tags: { type: "array", items: { type: "string" } },
            tldr: { type: "array", items: { type: "string" } },
            image: { type: "string" },
            published: { type: "boolean" },
            difficulty: { type: "string", enum: ["debutant", "intermediaire", "avance"], description: "Niveau (tutos uniquement)" },
            ...EN_FIELDS,
          },
        },
      },
      {
        name: "translate_article",
        description: "Génère (ou régénère) la version anglaise d'un article via Mistral à partir du FR : titre, chapeau, points clés et corps.",
        inputSchema: {
          type: "object",
          required: ["slug"],
          properties: { slug: { type: "string" } },
        },
      },
      {
        name: "search_articles",
        description: "Recherche plein-texte dans les articles publiés (titre, chapeau, corps, tags)",
        inputSchema: {
          type: "object",
          required: ["query"],
          properties: {
            query: { type: "string" },
            limit: { type: "number", description: "Nombre max (défaut 20)" },
          },
        },
      },
      {
        name: "set_breaking",
        description: "Marque un article comme « à la une » (breaking) pour une durée donnée, ou retire le statut.",
        inputSchema: {
          type: "object",
          required: ["slug"],
          properties: {
            slug: { type: "string" },
            hours: { type: "number", description: "Durée en heures (défaut : breakingDurationHours des réglages). 0 = retirer le statut." },
          },
        },
      },
      {
        name: "schedule_article",
        description: "Planifie la publication d'un article à une date future (le passe en brouillon jusque-là).",
        inputSchema: {
          type: "object",
          required: ["slug", "scheduled_at"],
          properties: {
            slug: { type: "string" },
            scheduled_at: { type: "string", description: "Date ISO 8601 de publication (ex: 2026-06-25T09:00:00Z)" },
          },
        },
      },
      {
        name: "unpublish_article",
        description: "Repasse un article publié en brouillon (le retire du site sans le supprimer).",
        inputSchema: {
          type: "object",
          required: ["slug"],
          properties: { slug: { type: "string" } },
        },
      },
      {
        name: "list_tags",
        description: "Liste tous les tags avec le nombre d'articles associés",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "rename_tag",
        description: "Renomme un tag (fusionne avec le tag cible s'il existe déjà)",
        inputSchema: {
          type: "object",
          required: ["from", "to"],
          properties: {
            from: { type: "string", description: "Nom actuel du tag" },
            to: { type: "string", description: "Nouveau nom" },
          },
        },
      },
      {
        name: "delete_tag",
        description: "Supprime un tag de tous les articles",
        inputSchema: {
          type: "object",
          required: ["name"],
          properties: { name: { type: "string" } },
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
        description:
          "Statistiques du site : trafic (pages vues, visiteurs uniques, sources, appareils, pays), articles, abonnés, top pages/articles",
        inputSchema: {
          type: "object",
          properties: {
            range: {
              type: "string",
              enum: ["24h", "7d", "30d", "90d", "12m"],
              description: "Période d'analyse du trafic (défaut : 30d)",
            },
          },
        },
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
        description: "Met à jour les réglages du site (seuls les champs fournis changent)",
        inputSchema: {
          type: "object",
          properties: {
            siteName: { type: "string" },
            tagline: { type: "string" },
            seoDescription: { type: "string" },
            breakingThreshold: { type: "number" },
            queueThreshold: { type: "number" },
            maxArticlesPerRun: { type: "number" },
            maxArticlesPerDay: { type: "number" },
            breakingDurationHours: { type: "number" },
            socialX: { type: "string" },
            socialLinkedin: { type: "string" },
            socialGithub: { type: "string" },
            maintenanceMode: { type: "boolean" },
            adsEnabled: { type: "boolean" },
            adsCode: { type: "string" },
            requireApproval: { type: "boolean" },
            blacklistKeywords: { type: "string" },
            blacklistDomains: { type: "string" },
            xIncludeLink: { type: "boolean" },
            xTutoIncludeLink: { type: "boolean" },
            xPostsPerDay: { type: "number" },
            xFirstHour: { type: "number" },
            xLastHour: { type: "number" },
            llmProvider: { type: "string", enum: ["mistral", "claude"] },
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
          const translated = await applyTranslation(slug, args);
          return ok({ slug, url: `/articles/${slug}`, translated });
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
          const translated = await applyTranslation(args.slug as string, args);
          return ok({ slug: args.slug, translated });
        }

        case "translate_article": {
          const en = await autoTranslateArticle(args.slug as string);
          return ok({ slug: args.slug, ...en });
        }

        case "search_articles": {
          const results = await searchArticlesFts(args.query as string);
          const limited = results.slice(0, (args.limit as number) ?? 20);
          return ok(limited.map((a) => ({
            slug: a.slug, title: a.title, type: a.type, date: a.date, views: a.views, tags: a.tags,
          })));
        }

        case "set_breaking": {
          const db = getDb();
          const row = db.prepare("SELECT id FROM articles WHERE slug = ?").get(args.slug) as { id: number } | undefined;
          if (!row) return err(`Article "${args.slug}" introuvable`);
          const hours = args.hours === undefined ? getSettings().breakingDurationHours : (args.hours as number);
          const until = hours > 0 ? new Date(Date.now() + hours * 3600_000).toISOString() : null;
          db.prepare("UPDATE articles SET breaking_until = ? WHERE id = ?").run(until, row.id);
          return ok({ slug: args.slug, breakingUntil: until });
        }

        case "schedule_article": {
          const db = getDb();
          const row = db.prepare("SELECT id FROM articles WHERE slug = ?").get(args.slug) as { id: number } | undefined;
          if (!row) return err(`Article "${args.slug}" introuvable`);
          const when = new Date(args.scheduled_at as string);
          if (Number.isNaN(when.getTime())) return err("Date scheduled_at invalide");
          db.prepare("UPDATE articles SET published = 0, scheduled_at = ? WHERE id = ?").run(when.toISOString(), row.id);
          return ok({ slug: args.slug, scheduledAt: when.toISOString() });
        }

        case "unpublish_article": {
          const db = getDb();
          const res = db.prepare("UPDATE articles SET published = 0 WHERE slug = ?").run(args.slug);
          if (res.changes === 0) return err(`Article "${args.slug}" introuvable`);
          return ok({ slug: args.slug, published: false });
        }

        case "list_tags": {
          return ok(await getAllTags({ includeDrafts: true }));
        }

        case "rename_tag": {
          await renameTag(args.from as string, args.to as string);
          return ok({ from: args.from, to: args.to });
        }

        case "delete_tag": {
          await deleteTag(args.name as string);
          return ok({ deleted: args.name });
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
          const range = (["24h", "7d", "30d", "90d", "12m"].includes(args.range as string)
            ? args.range
            : "30d") as "24h" | "7d" | "30d" | "90d" | "12m";
          const traffic = getAnalytics({ range });
          return ok({
            stats,
            topArticles,
            subscribers,
            traffic: {
              range: traffic.range,
              kpis: traffic.kpis,
              topPages: traffic.topPages,
              referrers: traffic.referrers,
              sections: traffic.sections,
              devices: traffic.devices,
              countries: traffic.countries,
            },
          });
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
          const slug = await publishPendingItem(args.id as number);
          return ok({ approved: args.id, slug, url: `/articles/${slug}` });
        }

        case "reject_article": {
          rejectPendingItem(args.id as number);
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

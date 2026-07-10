export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const cron = await import("node-cron");
    const { runPipeline } = await import("../pipeline/run");
    const { runBackup } = await import("./lib/backup");
    const { sendWeeklyDigest } = await import("./lib/newsletter");
    const { runXScheduled } = await import("./lib/x");
    const { pruneOldPageViews } = await import("./lib/analytics");
    const { pruneOldLlmTraces } = await import("./lib/llm-metrics");

    const intervalMin = process.env.PIPELINE_INTERVAL_MIN
      ? parseInt(process.env.PIPELINE_INTERVAL_MIN, 10)
      : 30;

    cron.default.schedule(`*/${intervalMin} * * * *`, () => {
      runPipeline().catch((err: unknown) =>
        console.error("[pipeline] erreur :", err instanceof Error ? err.message : err)
      );
    });

    // Backup quotidien de la base (snapshot dans le volume, rotation 14 jours)
    cron.default.schedule("0 3 * * *", () => {
      runBackup()
        .then((file) => console.log("[backup] snapshot créé :", file))
        .catch((err: unknown) =>
          console.error("[backup] erreur :", err instanceof Error ? err.message : err)
        );
      try {
        const deleted = pruneOldPageViews(180);
        if (deleted > 0) console.log(`[analytics] purge : ${deleted} évènements > 180j supprimés`);
      } catch (err) {
        console.error("[analytics] purge erreur :", err instanceof Error ? err.message : err);
      }
      try {
        const deleted = pruneOldLlmTraces(90);
        if (deleted > 0) console.log(`[llm] purge : ${deleted} traces > 90j supprimées`);
      } catch (err) {
        console.error("[llm] purge erreur :", err instanceof Error ? err.message : err);
      }
    }, { timezone: "Europe/Paris" });

    // Digest newsletter hebdo : mardi 9h (heure de Paris)
    cron.default.schedule(
      "0 9 * * 2",
      () => {
        sendWeeklyDigest()
          .then((r) => console.log("[newsletter] digest hebdo :", JSON.stringify(r)))
          .catch((err: unknown) =>
            console.error("[newsletter] erreur :", err instanceof Error ? err.message : err)
          );
      },
      { timezone: "Europe/Paris" }
    );

    // Posts X : un seul vérificateur toutes les 30 min, piloté par les réglages
    // (nombre/jour + fenêtre horaire). Il publie le prochain créneau dû et rattrape
    // un créneau raté après un redéploiement. La logique vit dans runXScheduled.
    const tickX = (label: string) =>
      runXScheduled()
        .then((r) => console.log(`[x] ${label} :`, JSON.stringify(r)))
        .catch((err: unknown) =>
          console.error(`[x] erreur ${label} :`, err instanceof Error ? err.message : err)
        );

    cron.default.schedule("*/30 * * * *", () => void tickX("check"), { timezone: "Europe/Paris" });
    // Rattrapage immédiat au boot (redéploiement), sans attendre le prochain tick.
    setTimeout(() => void tickX("check boot"), 15_000);

    console.log(`[watch·ia] Pipeline toutes les ${intervalMin} min · backup quotidien 03:00 · newsletter mardi 09:00 · posts X pilotés par les réglages`);
  }
}

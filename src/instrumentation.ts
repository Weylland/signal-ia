export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const cron = await import("node-cron");
    const { runPipeline } = await import("../pipeline/run");
    const { runBackup } = await import("./lib/backup");

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
    });

    console.log(`[watch·ia] Pipeline toutes les ${intervalMin} min · backup quotidien 03:00`);
  }
}

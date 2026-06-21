export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const cron = await import("node-cron");
    const { runPipeline } = await import("../pipeline/run");
    const { runBackup } = await import("./lib/backup");
    const { sendWeeklyDigest } = await import("./lib/newsletter");
    const { runXDigest } = await import("./lib/x");

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

    // Post X quotidien : base 11:30 (heure de Paris) + jitter aléatoire 0-120 min pour ne pas faire robot
    cron.default.schedule(
      "30 11 * * *",
      () => {
        const jitterMs = Math.floor(Math.random() * 120 * 60_000);
        setTimeout(() => {
          runXDigest("fr")
            .then((r) => console.log("[x] post quotidien :", JSON.stringify(r)))
            .catch((err: unknown) =>
              console.error("[x] erreur :", err instanceof Error ? err.message : err)
            );
        }, jitterMs);
      },
      { timezone: "Europe/Paris" }
    );

    console.log(`[watch·ia] Pipeline toutes les ${intervalMin} min · backup quotidien 03:00 · newsletter mardi 09:00 · post X quotidien ~11:30`);
  }
}

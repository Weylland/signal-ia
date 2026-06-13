export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const cron = await import("node-cron");
    const { runPipeline } = await import("../pipeline/run");

    const intervalMin = process.env.PIPELINE_INTERVAL_MIN
      ? parseInt(process.env.PIPELINE_INTERVAL_MIN, 10)
      : 30;

    cron.default.schedule(`*/${intervalMin} * * * *`, () => {
      runPipeline().catch((err: unknown) =>
        console.error("[pipeline] erreur :", err instanceof Error ? err.message : err)
      );
    });

    console.log(`[signal·ia] Pipeline planifié toutes les ${intervalMin} min`);
  }
}

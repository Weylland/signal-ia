import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import path from "node:path";

let spaceGrotesk: Buffer | null = null;
let jetbrainsMono: Buffer | null = null;

function fonts() {
  if (!spaceGrotesk) {
    spaceGrotesk = readFileSync(path.join(process.cwd(), "src/assets/fonts/SpaceGrotesk.ttf"));
    jetbrainsMono = readFileSync(path.join(process.cwd(), "src/assets/fonts/JetBrainsMono.ttf"));
  }
  return { spaceGrotesk: spaceGrotesk!, jetbrainsMono: jetbrainsMono! };
}

const LIME = "#c8f54e";
const DARK = "#181e17";
const INK = "#f0ede4";
const DIM = "#8a9b88";

function titleSize(title: string): number {
  if (title.length <= 48) return 66;
  if (title.length <= 78) return 54;
  if (title.length <= 110) return 46;
  return 40;
}

export async function generateXCard({
  title,
  kind,
}: {
  title: string;
  kind: "news" | "tuto";
}): Promise<Buffer> {
  const { spaceGrotesk, jetbrainsMono } = fonts();
  const tag = kind === "tuto" ? "TUTO" : "ACTU";

  const image = new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "675px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: DARK,
          borderTop: `12px solid ${LIME}`,
          padding: "64px",
          fontFamily: "Space Grotesk",
        }}
      >
        <div style={{ display: "flex" }}>
          <div
            style={{
              display: "flex",
              background: LIME,
              color: DARK,
              fontFamily: "JetBrains Mono",
              fontSize: "22px",
              fontWeight: 700,
              letterSpacing: "0.15em",
              padding: "8px 18px",
            }}
          >
            {tag}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            color: INK,
            fontSize: `${titleSize(title)}px`,
            fontWeight: 700,
            lineHeight: 1.12,
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "52px",
                height: "52px",
                borderRadius: "999px",
                border: `7px solid ${LIME}`,
                marginRight: "18px",
              }}
            >
              <div style={{ display: "flex", width: "16px", height: "16px", borderRadius: "999px", background: LIME }} />
            </div>
            <div style={{ display: "flex", fontSize: "34px", fontWeight: 700 }}>
              <span style={{ color: LIME }}>watch</span>
              <span style={{ color: INK }}>·ia</span>
            </div>
          </div>
          <div style={{ display: "flex", color: DIM, fontFamily: "JetBrains Mono", fontSize: "20px" }}>
            watch-ia.com
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 675,
      fonts: [
        { name: "Space Grotesk", data: spaceGrotesk, weight: 700, style: "normal" },
        { name: "JetBrains Mono", data: jetbrainsMono, weight: 700, style: "normal" },
      ],
    }
  );

  return Buffer.from(await image.arrayBuffer());
}

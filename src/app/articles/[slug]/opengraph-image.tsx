import { ImageResponse } from "next/og";
import { getArticle } from "@/lib/articles";
import { getSettings } from "@/lib/settings";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticle(slug);
  const { siteName } = getSettings();

  const title = article?.title ?? siteName;
  const type = article?.type === "tuto" ? "TUTORIEL" : "ACTUALITÉ";
  const tag = article?.tags[0]?.toUpperCase() ?? "IA";

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "#181e17",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px",
          fontFamily: "serif",
          border: "8px solid #c8f54e",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              background: "#c8f54e",
              color: "#181e17",
              padding: "4px 14px",
              fontSize: 18,
              fontFamily: "monospace",
              fontWeight: 700,
              letterSpacing: "0.1em",
            }}
          >
            {type}
          </div>
          <div
            style={{
              color: "#c8f54e",
              fontSize: 18,
              fontFamily: "monospace",
              letterSpacing: "0.08em",
            }}
          >
            {tag}
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            color: "#f0ede4",
            fontSize: title.length > 80 ? 44 : title.length > 50 ? 52 : 62,
            lineHeight: 1.05,
            maxWidth: 1000,
          }}
        >
          {title}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              color: "#c8f54e",
              fontSize: 28,
              fontFamily: "monospace",
              fontWeight: 700,
              letterSpacing: "0.05em",
            }}
          >
            {siteName}
          </div>
          <div
            style={{
              color: "#6b7a69",
              fontSize: 16,
              fontFamily: "monospace",
            }}
          >
            L&apos;essentiel de l&apos;IA
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}

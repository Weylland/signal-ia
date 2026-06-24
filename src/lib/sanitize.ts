import sanitizeHtml from "sanitize-html";

// Vocabulaire SVG autorisé pour les schémas inline (diagrammes des tutos).
// Pas de <script>, <foreignObject>, ni handlers on* : la sécurité repose sur
// l'allowlist de tags/attributs + la restriction des schémas d'URL.
const SVG_TAGS = [
  "svg", "g", "defs", "marker", "path", "line", "polyline", "polygon",
  "rect", "circle", "ellipse", "text", "tspan", "title", "desc",
  "linearGradient", "radialGradient", "stop", "use", "clipPath", "symbol",
];

const SVG_ATTRS = [
  "viewBox", "xmlns", "xmlns:xlink", "preserveAspectRatio", "width", "height",
  "fill", "fill-opacity", "fill-rule", "stroke", "stroke-width", "stroke-linecap",
  "stroke-linejoin", "stroke-dasharray", "stroke-dashoffset", "stroke-opacity",
  "opacity", "d", "x", "y", "x1", "y1", "x2", "y2", "cx", "cy", "r", "rx", "ry",
  "dx", "dy", "points", "transform", "transform-origin", "text-anchor",
  "dominant-baseline", "alignment-baseline", "font-size", "font-family",
  "font-weight", "font-style", "letter-spacing", "gradientUnits",
  "gradientTransform", "offset", "stop-color", "stop-opacity", "marker-start",
  "marker-mid", "marker-end", "markerWidth", "markerHeight", "markerUnits",
  "refX", "refY", "orient", "clip-path", "id", "class", "style", "role",
  "aria-hidden", "href", "xlink:href",
];

export function cleanHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p", "br", "strong", "em", "u", "s", "a", "h2", "h3", "ul", "ol", "li",
      "blockquote", "code", "pre", "img", "figure", "figcaption",
      ...SVG_TAGS,
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt"],
      figure: ["style", "class"],
      figcaption: ["style", "class"],
      "*": SVG_ATTRS,
    },
    allowedStyles: {
      "*": {
        margin: [/^[\d.\sa-z%-]+$/i],
        "margin-top": [/^[\d.a-z%-]+$/i],
        "margin-bottom": [/^[\d.a-z%-]+$/i],
        width: [/^[\d.a-z%-]+$/i],
        "max-width": [/^[\d.a-z%-]+$/i],
        display: [/^(block|inline-block|flex|none)$/],
        "text-align": [/^(left|center|right)$/],
        "font-size": [/^[\d.a-z%-]+$/i],
        color: [/^#(0x)?[0-9a-f]+$/i, /^rgb\([\d\s,]+\)$/],
      },
    },
    allowedSchemes: ["https", "http", "mailto"],
    parser: { lowerCaseTags: false, lowerCaseAttributeNames: false },
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }),
    },
  });
}

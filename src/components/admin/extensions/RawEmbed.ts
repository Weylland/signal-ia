import { Node } from "@tiptap/core";

/**
 * Bloc « embed brut » : préserve un fragment HTML/SVG arbitraire (typiquement un
 * schéma) que TipTap stripperait sinon. Le HTML est stocké tel quel dans
 * l'attribut `html`, rendu en lecture seule dans l'éditeur, et ré-émis intact
 * à la sauvegarde. Aucun fichier : le schéma vit dans le HTML de l'article.
 */

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    rawEmbed: {
      setRawEmbed: (html: string) => ReturnType;
    };
  }
}

export const RawEmbed = Node.create({
  name: "rawEmbed",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      html: { default: "" },
    };
  },

  parseHTML() {
    return [
      {
        tag: "figure",
        priority: 60,
        getAttrs: (el) => ({ html: (el as HTMLElement).outerHTML }),
      },
      {
        tag: "svg",
        priority: 60,
        getAttrs: (el) => ({ html: (el as HTMLElement).outerHTML }),
      },
    ];
  },

  renderHTML({ node }) {
    const tpl = document.createElement("div");
    tpl.innerHTML = (node.attrs.html as string) ?? "";
    const el = tpl.firstElementChild;
    if (el) return el as HTMLElement;
    return ["figure", {}];
  },

  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement("div");
      dom.className = "raw-embed";
      dom.contentEditable = "false";
      dom.setAttribute("data-raw-embed", "");
      dom.innerHTML = (node.attrs.html as string) ?? "";
      return { dom };
    };
  },

  addCommands() {
    return {
      setRawEmbed:
        (html: string) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: { html } }),
    };
  },
});

export function sanitizeLegalHtml(raw: unknown) {
  const source = String(raw || "");
  if (!source.trim()) return "";

  const parser = new DOMParser();
  let doc = parser.parseFromString(source, "text/html");

  const hasElementNodes = Array.from(doc.body.childNodes).some((node) => node.nodeType === Node.ELEMENT_NODE);
  const looksEscapedHtml = /&lt;\s*[a-z!/]/i.test(source);
  if (!hasElementNodes && looksEscapedHtml) {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = source;
    doc = parser.parseFromString(textarea.value, "text/html");
  }

  doc.querySelectorAll("script, iframe, object, embed, form").forEach((node) => {
    node.remove();
  });

  doc.querySelectorAll("*").forEach((element) => {
    Array.from(element.attributes).forEach((attr) => {
      const name = attr.name.toLowerCase();
      const value = String(attr.value || "").trim().toLowerCase();

      if (name.startsWith("on")) {
        element.removeAttribute(attr.name);
        return;
      }

      if (name === "href" || name === "src") {
        const protocol = value.split(":")[0]?.trim();
        if (protocol === "javascript") {
          element.removeAttribute(attr.name);
        }
      }
    });
  });

  return doc.body.innerHTML;
}

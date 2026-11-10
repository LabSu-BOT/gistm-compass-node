// Quebra o texto do requisito nas subdivisões do GISTM ("A.", "B.", "(i)")
// para mostrar como itens a, b, c. Sem marcação, items vem vazio.

export interface RequirementPart {
  label: string; // "a", "b", "c"...
  text: string;
  subItems: { label: string; text: string }[]; // "i", "ii"...
}

export interface RequirementStructure {
  intro: string;
  items: RequirementPart[];
}

const LETTERS = "ABCDEFGHIJKLMNOP";

/** Lista numerada "1. ... 2. ..." dentro de uma subdivisão (ex.: 4.2-B). */
function splitNumbered(text: string): { intro: string; subItems: { label: string; text: string }[] } {
  const marks: { label: string; index: number; end: number }[] = [];
  let from = 0;
  for (let n = 1; n <= 20; n++) {
    const re = new RegExp(`(^|[\\s:;])${n}\\.\\s`, "g");
    re.lastIndex = from;
    const m = re.exec(text);
    if (!m) break;
    const index = m.index + m[1].length;
    const end = index + String(n).length + 2;
    marks.push({ label: String(n), index, end });
    from = end;
  }
  if (marks.length < 2) return { intro: text, subItems: [] };
  return {
    intro: text.slice(0, marks[0].index).trim(),
    subItems: marks.map((mk, i) => ({
      label: mk.label,
      text: text.slice(mk.end, i + 1 < marks.length ? marks[i + 1].index : undefined).trim(),
    })),
  };
}

function splitRoman(text: string): { intro: string; subItems: { label: string; text: string }[] } {
  const re = /\((i{1,3}|iv|v|vi{1,3}|ix|x)\)\s*/g;
  const marks: { label: string; index: number; end: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) marks.push({ label: m[1], index: m.index, end: re.lastIndex });
  // Só trata como lista se começar em (i) e tiver ao menos dois itens;
  // senão tenta a numeração "1. 2. 3.".
  if (marks.length < 2 || marks[0].label !== "i") return splitNumbered(text);
  const intro = text.slice(0, marks[0].index).trim();
  const subItems = marks.map((mk, i) => ({
    label: mk.label,
    text: text
      .slice(mk.end, i + 1 < marks.length ? marks[i + 1].index : undefined)
      .trim(),
  }));
  return { intro, subItems };
}

export function parseRequirement(description: string): RequirementStructure {
  const text = description.replace(/\s+/g, " ").trim();

  // Procura "A. ", "B. "... em sequência (A, depois B, depois C).
  const marks: { letter: string; index: number; end: number }[] = [];
  let from = 0;
  for (const letter of LETTERS) {
    const re = new RegExp(`(^|[\\s:;.])${letter}\\.\\s`, "g");
    re.lastIndex = from;
    const m = re.exec(text);
    if (!m) break;
    const index = m.index + m[1].length;
    marks.push({ letter, index, end: index + 3 });
    from = index + 3;
  }

  if (marks.length >= 2) {
    const intro = text.slice(0, marks[0].index).trim();
    const items = marks.map((mk, i) => {
      const body = text.slice(mk.end, i + 1 < marks.length ? marks[i + 1].index : undefined).trim();
      const { intro: bodyIntro, subItems } = splitRoman(body);
      return { label: mk.letter.toLowerCase(), text: bodyIntro, subItems };
    });
    return { intro, items };
  }

  // Sem letras: tenta só a lista em romanos.
  const { intro, subItems } = splitRoman(text);
  if (subItems.length >= 2) {
    return {
      intro,
      items: subItems.map((s, i) => ({ label: LETTERS[i].toLowerCase(), text: s.text, subItems: [] })),
    };
  }

  return { intro: text, items: [] };
}

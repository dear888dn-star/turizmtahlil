#!/usr/bin/env python3
"""A.N. Xoliqulovning "Turistik korxonalar faoliyati tahlili" o'quv qo'llanmasini (PDF, kirill)
platforma formatiga (lotin) o'giradi.

Foydalanish:
    python3 scripts/import-pdf.py "manbalar/Туристик_корхоналар_фаолияти_таҳлили_Ўқув_қўлланма_.pdf"

Natija: public/data/book.js — kirish, 18 bob (mavzu) matni bo'limlarga ajratilgan holda,
mavzu bo'yicha savollar, tayanch iboralar va adabiyotlar ro'yxati.

Talab: poppler-utils (pdftotext). Jadval va formulalar sahifadagi joylashuvi saqlangan holda
(<pre>) beriladi, oddiy matn xatboshilarga birlashtiriladi.
"""
import html
import json
import re
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from translit import to_latin  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent

ROMAN = r"[IVXХ]+"  # PDFda ba'zan lotin X o'rniga kirill Х uchraydi
CHAPTER_RE = re.compile(rf"^\s*({ROMAN})\s+БОБ\.?\s*(.*)$")
SECTION_RE = re.compile(r"^\s{0,30}(\d{1,2}\.\d{1,2}(?:\.\d{1,2})?)\.\s+(\S.*)$")
TABLE_CAP_RE = re.compile(r"^\s{8,}\d{1,2}\.\d{1,2}\.?\s*-?\s*жадвал", re.I)
QUESTIONS_RE = re.compile(r"^\s*(Мавзу бўйича саволлар|Такрорлаш учун саволлар)\s*$")
KEYWORDS_RE = re.compile(r"^\s*Мавзу бўйича таянч", re.I)
LIT_RE = re.compile(r"^\s*ФОЙДАЛАНИЛГАН АДАБИЁТЛАР")
INTRO_RE = re.compile(r"^\s*КИРИШ\s*$")


def roman_to_int(s):
    s = s.replace("Х", "X")
    vals = {"I": 1, "V": 5, "X": 10}
    total = 0
    for i, ch in enumerate(s):
        v = vals[ch]
        total += -v if i + 1 < len(s) and vals[s[i + 1]] > v else v
    return total


def pages(pdf):
    txt = subprocess.run(["pdftotext", "-layout", str(pdf), "-"], capture_output=True, text=True, check=True).stdout
    out = []
    for page in txt.split("\f"):
        lines = page.rstrip("\n").split("\n")
        while lines and not lines[-1].strip():
            lines.pop()
        if lines and re.fullmatch(r"\s*\d{1,3}\s*", lines[-1]):
            lines.pop()
        # sahifa ostidagi izohlar (izoh raqami 0-ustunda yolg'iz turadi)
        for i in range(len(lines) - 1, max(len(lines) - 15, 0), -1):
            if re.fullmatch(r"\d{1,2}", lines[i]) and i > 0 and not lines[i - 1].strip():
                lines = lines[:i]
                break
        out.append(lines)
    return out


def is_prose(line):
    s = line.strip()
    if not s:
        return False
    indent = len(line) - len(line.lstrip())
    if indent > 7:
        return False
    nums = len(re.findall(r"(?<![\wА-Яа-я])[-+]?\d[\d\s]*[,.]?\d*(?![\wА-Яа-я])", s))
    words = len(re.findall(r"[А-Яа-яЁёЎўҚқҒғҲҳA-Za-z]{2,}", s))
    gaps = len(re.findall(r"\S\s{3,}\S", s))
    if nums >= 3 and nums >= words:
        return False
    if gaps >= 2 and nums >= 2:
        return False
    if words >= 3 or len(s) > 40:
        return True
    return words >= 1 and nums < 2 and gaps == 0


def clean(s):
    s = re.sub(r"\s+", " ", s).strip()
    s = re.sub(r"(?<=[А-Яа-яЁёЎўҚқҒғҲҳ])(\d{1,2})(?=[.,;:]?\s|$)", "", s)  # izoh belgilari: "мумкин3."
    return to_latin(s)


class Builder:
    def __init__(self):
        self.blocks = []  # (kind, text)
        self.para = []
        self.pre = []

    def flush_para(self):
        if self.para:
            self.blocks.append(("p", clean(" ".join(self.para))))
            self.para = []

    def flush_pre(self):
        while self.pre and not self.pre[-1].strip():
            self.pre.pop()
        if self.pre:
            ind = min(len(x) - len(x.lstrip()) for x in self.pre if x.strip())
            self.blocks.append(("pre", to_latin("\n".join(x[ind:].rstrip() for x in self.pre))))
            self.pre = []

    def flush(self):
        self.flush_para()
        self.flush_pre()

    def prose(self, line):
        self.flush_pre()
        indent = len(line) - len(line.lstrip())
        if indent >= 3 and self.para:
            self.flush_para()
        # bo'g'in ko'chirish: "чора-\nтадбирлар"
        if self.para and self.para[-1].endswith("-") and not self.para[-1].endswith(" -"):
            self.para[-1] = self.para[-1] + line.strip()
            return
        self.para.append(line.strip())

    def raw(self, line):
        self.flush_para()
        self.pre.append(line)


def blocks_html(blocks):
    out = []
    for kind, text in blocks:
        if not text.strip():
            continue
        if kind == "p":
            m = re.match(r"^(\d{1,2}\.\d{1,2}\.?\s*-?\s*jadval\.?)\s*(.*)$", text, re.I)
            if m:
                out.append(f'<p class="caption"><b>{html.escape(m.group(1))}</b> {html.escape(m.group(2))}</p>')
            elif re.match(r"^(Manba|Izoh)\s*:", text):
                out.append(f'<p class="source">{html.escape(text)}</p>')
            else:
                out.append(f"<p>{html.escape(text)}</p>")
        elif kind == "h":
            out.append(f"<h4>{html.escape(text)}</h4>")
        else:
            out.append(f'<pre class="book-pre">{html.escape(text)}</pre>')
    return "".join(out)


def parse_toc(lines):
    """Mundarija: {"2.2.1": "Solishtirish usuli", ...} — bo'lim nomlari uchun asosiy manba."""
    try:
        a = next(i for i, ln in enumerate(lines) if "МУНДАРИЖА" in ln)
    except StopIteration:
        return {}
    b = next(i for i in range(a + 1, len(lines)) if INTRO_RE.match(lines[i]) and i > a + 5) if any(INTRO_RE.match(x) for x in lines[a + 5:]) else len(lines)
    text = " ".join(x.strip() for x in lines[a + 1:b] if not re.fullmatch(r"\s*\d{1,3}\s*", x))
    toc = {}
    ms = list(re.finditer(r"(?<![\d.])(\d{1,2}\.\d{1,2}(?:\.\d{1,2})?)\.\s+", text))
    for k, m in enumerate(ms):
        end = ms[k + 1].start() if k + 1 < len(ms) else len(text)
        t = text[m.end():end]
        t = re.split(rf"\s(?:{ROMAN})\s+БОБ|ФОЙДАЛАНИЛГАН", t)[0]
        t = re.sub(r"[\s.]*\d{1,3}\s*$", "", t)
        t = re.sub(r"\s*\.{2,}.*$", "", t)
        toc.setdefault(m.group(1), re.sub(r"\s+", " ", t).strip(" ."))
    return toc


def norm(s):
    return re.sub(r"[^а-яёўқғҳa-z0-9]", "", s.lower())


def parse(pdf):
    allp = pages(pdf)
    lines = [ln for p in allp for ln in p]
    toc = parse_toc(lines)
    seen = set()
    # Mundarijani o'tkazib yuborish: matn "КИРИШ" sarlavhasidan (ikkinchi uchrashuv) boshlanadi
    starts = [i for i, ln in enumerate(lines) if INTRO_RE.match(ln)]
    i0 = starts[-1] if starts else 0
    lines = lines[i0 + 1:]

    intro = Builder()
    topics = []
    literature = []
    cur = None  # joriy bob
    sec = None
    mode = "intro"
    i = 0
    n = len(lines)

    def new_section(title):
        nonlocal sec
        cur["b"].flush()
        sec = {"title": title, "b": Builder()}
        cur["sections"].append(sec)

    while i < n:
        ln = lines[i]
        s = ln.strip()
        if LIT_RE.match(ln):
            if cur:
                cur["b"].flush()
            mode = "lit"
            i += 1
            continue
        if mode == "lit":
            if s:
                if re.match(r"^\d{1,3}\.\s", s) or not literature:
                    literature.append(s)
                else:
                    literature[-1] += " " + s
            i += 1
            continue
        m = CHAPTER_RE.match(ln)
        if m and ln.lstrip().upper() == ln.lstrip():
            if mode == "intro":
                intro.flush()
            elif sec:
                sec["b"].flush()
            title = m.group(2).strip()
            i += 1
            while i < n and lines[i].strip() and lines[i].strip().upper() == lines[i].strip() and not SECTION_RE.match(lines[i]):
                title += " " + lines[i].strip()
                i += 1
            num = len(topics) + 1
            cur = {"num": num, "roman": m.group(1).replace("Х", "X"), "title": clean(title).rstrip(".").strip(), "sections": [], "questions": [], "keywords": [], "b": Builder()}
            topics.append(cur)
            sec = None
            mode = "chapter"
            continue
        if mode == "intro":
            if s:
                intro.prose(ln) if is_prose(ln) else intro.raw(ln)
            i += 1
            continue
        m = SECTION_RE.match(ln)
        if m and m.group(1) in toc and m.group(1) not in seen and m.group(1).split(".")[0] == str(cur["num"]):
            num = m.group(1)
            seen.add(num)
            title = toc[num]
            # sarlavhaning keyingi qatorlarga ko'chgan qismini o'tkazib yuborish
            acc = norm(m.group(2))
            i += 1
            while i < n and lines[i].strip() and len(acc) < len(norm(title)) and norm(title).startswith(acc + norm(lines[i])[:5]):
                acc += norm(lines[i])
                i += 1
            if num.count(".") == 2:
                tgt = (sec or cur)["b"]
                tgt.flush()
                tgt.blocks.append(("h", clean(f"{num}. {title}")))
            else:
                new_section(clean(f"{num}. {title}"))
            continue
        if QUESTIONS_RE.match(ln):
            (sec or cur)["b"].flush()
            i += 1
            qs = []
            while i < n and not CHAPTER_RE.match(lines[i]) and not LIT_RE.match(lines[i]):
                t = lines[i].strip()
                if t:
                    if re.match(r"^\d{1,2}\.\s", t):
                        qs.append(re.sub(r"^\d{1,2}\.\s*", "", t))
                    elif qs and not qs[-1].rstrip().endswith("?"):
                        qs[-1] += " " + t
                    else:
                        break
                i += 1
            cur["questions"] += [clean(q) for q in qs]
            continue
        if KEYWORDS_RE.match(ln):
            (sec or cur)["b"].flush()
            i += 1
            kw = []
            while i < n and lines[i].strip() and not QUESTIONS_RE.match(lines[i]) and not CHAPTER_RE.match(lines[i]):
                kw.append(lines[i].strip())
                i += 1
            words = clean(" ".join(kw))
            cur["keywords"] += [w.strip(" .") for w in re.split(r",\s*", words) if w.strip(" .")]
            continue
        target = (sec or cur)["b"]
        if not s:
            # bo'sh qator: jadval bloki ichida saqlanadi
            if target.pre:
                target.pre.append("")
            i += 1
            continue
        if TABLE_CAP_RE.match(ln):
            target.flush()
            cap = [s]
            i += 1
            # jadval nomi (markazlashgan bir necha qator)
            while i < n and lines[i].strip() and (len(lines[i]) - len(lines[i].lstrip())) >= 2 and not re.search(r"\d", lines[i]) and not re.search(r"\S\s{3,}\S", lines[i].strip()) and len(lines[i].strip()) < 75 and len(cap) < 5:
                cap.append(lines[i].strip())
                i += 1
            target.blocks.append(("p", clean(" ".join(cap))))
            # jadval tanasi: "Манба"/"Изоҳ" qatorigacha yoki to'liq xatboshi boshlanguncha
            while i < n:
                t = lines[i]
                if re.match(r"^\s*(Манба|Изоҳ)\s*:", t):
                    target.flush_pre()
                    src = [t.strip()]
                    i += 1
                    target.blocks.append(("p", clean(" ".join(src))))
                    break
                if CHAPTER_RE.match(t) or SECTION_RE.match(t) or QUESTIONS_RE.match(t):
                    break
                if is_paragraph_start(lines, i) and target.pre:
                    break
                target.raw(t)
                i += 1
            target.flush_pre()
            continue
        if is_prose(ln):
            target.prose(ln)
        else:
            target.raw(ln)
        i += 1

    if cur:
        cur["b"].flush()
        if sec:
            sec["b"].flush()
    out_topics = []
    for t in topics:
        secs = []
        lead = blocks_html(t["b"].blocks)
        for k, s in enumerate(t["sections"]):
            s["b"].flush()
            body = blocks_html(s["b"].blocks)
            if k == 0 and lead:
                body = lead + body
            secs.append({"title": s["title"], "html": body})
        if not secs and lead:
            secs.append({"title": t["title"], "html": lead})
        plan = [s["title"] for s in secs if re.match(r"^\d+\.\d+\.\s", s["title"])]
        out_topics.append({
            "num": t["num"], "chapter": t["roman"], "title": t["title"], "plan": plan, "image": None,
            "sections": secs, "questions": t["questions"], "keywords": t["keywords"], "tests": [], "glossary": [],
        })
    intro.flush()
    return {"intro": blocks_html(intro.blocks), "topics": out_topics, "literature": [clean(x) for x in literature]}


def is_paragraph_start(lines, i):
    ln = lines[i]
    indent = len(ln) - len(ln.lstrip())
    return 3 <= indent <= 7 and is_prose(ln) and len(ln.strip()) > 50 and (i + 1 < len(lines) and is_prose(lines[i + 1]))


def is_prose_continuation(lines, i):
    """'2.3. ...' bilan boshlangan qator aslida xatbosh ichidagi raqam emasmi?"""
    prev = lines[i - 1].strip() if i else ""
    return bool(prev) and not prev.endswith((".", ":")) and len(prev) > 55


def main():
    pdf = Path(sys.argv[1] if len(sys.argv) > 1 else next((ROOT / "manbalar").glob("*.pdf")))
    book = parse(pdf)
    dst = ROOT / "public" / "data" / "book.js"
    dst.parent.mkdir(parents=True, exist_ok=True)
    head = (
        "// Avtomatik yaratilgan fayl — qo'lda tahrirlamang.\n"
        "// Manba: A.N. Xoliqulov. \"Turistik korxonalar faoliyati tahlili\". O'quv qo'llanma. Samarqand: STEP-SEL, 2024 (kirill → lotin).\n"
        "// Qayta yaratish: python3 scripts/import-pdf.py <fayl.pdf>\n"
    )
    dst.write_text(head + "export const BOOK = " + json.dumps(book, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")
    print(f"{len(book['topics'])} mavzu, {sum(len(t['sections']) for t in book['topics'])} bo'lim → {dst.relative_to(ROOT)}")
    for t in book["topics"]:
        print(f"  {t['num']:2}. [{t['chapter']}] {t['title'][:70]} — {len(t['sections'])} bo'lim, {len(t['questions'])} savol, {len(t['keywords'])} ibora")


if __name__ == "__main__":
    main()

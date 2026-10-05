"""O'zbek kirill yozuvini lotin yozuviga o'girish (1995-yilgi rasmiy qoidalar asosida)."""
import re

VOWELS = set("аеёиоуэюяўАЕЁИОУЭЮЯЎ")
BASE = {
    "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "ё": "yo", "ж": "j", "з": "z", "и": "i", "й": "y",
    "к": "k", "л": "l", "м": "m", "н": "n", "о": "o", "п": "p", "р": "r", "с": "s", "т": "t", "у": "u",
    "ф": "f", "х": "x", "ч": "ch", "ш": "sh", "щ": "sh", "ъ": "’", "ь": "", "ы": "i", "э": "e", "ю": "yu",
    "я": "ya", "ў": "o‘", "қ": "q", "ғ": "g‘", "ҳ": "h",
}


def _char(text, i):
    c = text[i]
    low = c.lower()
    prev = text[i - 1] if i > 0 else " "
    if low == "е":
        out = "ye" if (not prev.isalpha() or prev in VOWELS or prev in "ъЪьЬ") else "e"
    elif low == "ц":
        out = "ts" if prev in VOWELS else "s"
    elif low in BASE:
        out = BASE[low]
    else:
        return c
    if c != low and out:
        nxt = text[i + 1] if i + 1 < len(text) else " "
        prv_up = prev.isalpha() and prev.isupper()
        nxt_up = nxt.isalpha() and nxt.isupper()
        if prv_up or nxt_up:
            return out.upper().replace("‘", "‘")
        return out[0].upper() + out[1:]
    return out


def to_latin(text: str) -> str:
    if not re.search(r"[А-Яа-яЁёЎўҚқҒғҲҳ]", text):
        return text
    s = "".join(_char(text, i) for i in range(len(text)))
    return s.replace("«", "“").replace("»", "”")


if __name__ == "__main__":
    import sys
    print(to_latin(sys.stdin.read()))

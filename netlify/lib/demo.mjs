// AI kaliti ulanmagan holat uchun demo-rejim: oldindan yozilgan replikalar va kalit so'zlarga asoslangan baholash.
import { CRITERIA } from "./scenarios.mjs";

export function demoReply(scenario, messages) {
  const studentTurns = messages.filter((m) => m.role === "user").length;
  const lines = scenario.fallback;
  const line = lines[Math.min(studentTurns - 1, lines.length - 1)] || lines[lines.length - 1];
  return studentTurns >= lines.length ? `${line}\n[[YAKUNLANDI]]` : line;
}

const POLITE = ["assalomu", "salom", "hurmatli", "rahmat", "iltimos", "kechirasiz", "uzr", "xush kelibsiz", "welcome", "please", "sorry", "thank"];
const DIGITAL = ["taklif", "chora", "qaror", "reja", "kpi", "muddat", "shartnoma", "kontrakt", "avans", "chegirma", "optimallashtir", "kamaytir", "oshir"];
const PROBLEM = ["%", "foiz", "koeffitsiyent", "mln", "mlrd", "marta", "kun", "=", "/", "×", "o'sish", "nisbat"];

function count(text, words) {
  return words.reduce((n, w) => n + (text.includes(w) ? 1 : 0), 0);
}

export function demoEvaluation(scenario, messages, meta) {
  const student = messages.filter((m) => m.role === "user").map((m) => m.content.toLowerCase());
  const text = student.join(" \n");
  const words = text.split(/\s+/).filter(Boolean).length;
  const engagement = Math.min(1, student.length / 5) * Math.min(1, words / 120);
  const clamp = (v) => Math.max(0, Math.min(20, Math.round(v)));
  const hintPenalty = Math.min(4, meta.hintsUsed);

  const scores = {
    communication: clamp(6 + count(text, POLITE) * 3 + engagement * 6),
    knowledge: clamp(4 + count(text, scenario.keywords) * 3 + engagement * 5 - hintPenalty),
    problem: clamp(5 + count(text, PROBLEM) * 2.5 + engagement * 6 - hintPenalty),
    digital: clamp(4 + count(text, DIGITAL) * 3 + engagement * 4),
    service: clamp(7 + count(text, POLITE) * 2 + engagement * 6),
  };
  const missing = scenario.keywords.filter((k) => !text.includes(k)).slice(0, 5);
  return {
    scores,
    summary:
      "Demo-rejimdagi avtomatik baholash: natija kalit so'zlar, javoblar hajmi va muloqot odobi ko'rsatkichlariga asoslangan. To'liq AI tahlili uchun administrator GEMINI_API_KEY yoki ANTHROPIC_API_KEY kalitini ulashi kerak.",
    standard: "Demo-rejimda kasb standarti talablariga moslik avtomatik tahlil qilinmaydi. Ssenariy maqsadlari ro'yxati bilan o'z tahlilingizni solishtiring.",
    strengths: [
      student.length >= 4 ? "Suhbatda faol ishtirok etdingiz." : "Mashg'ulotni boshladingiz — bu birinchi qadam.",
      count(text, POLITE) > 1 ? "Xushmuomala murojaat iboralaridan foydalandingiz." : "Muloqotni davom ettirishga harakat qildingiz.",
    ],
    improvements: [
      missing.length ? `Quyidagi kalit tushunchalarga e'tibor bering: ${missing.join(", ")}.` : "Kalit tushunchalarni yaxshi qamrab oldingiz.",
      count(text, DIGITAL) < 2 ? "Aniq boshqaruv choralarini (nima, kim, qachon, kutilgan natija) taklif qiling." : "Takliflaringizni raqamli natija bilan bog'lang.",
    ],
    recommendations: ["Ssenariyni qayta o'ynab, har bir da'voni raqam bilan asoslang.", "Ssenariyga bog'langan mavzularning amaliy mashg'ulotlarini bajaring."],
    demo: true,
    criteria: CRITERIA,
  };
}

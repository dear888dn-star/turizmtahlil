// "Dolzarb ma'lumotlar": o'quv qo'llanmadagi eskirgan faktlar va ularning tekshirilgan yangi qiymatlari.
import { h, mount } from "../ui.js";
import { UPDATES, CHECKED } from "../../data/updates.js";
import { TOPICS } from "../../data/topics.js";
import { updateCard } from "./topics.js";

export async function render(el) {
  const areas = [...new Set(UPDATES.map((u) => u.area))];
  const list = h("div", { class: "stack" });
  let active = "all";
  const chips = h("div", { class: "chips" });
  const draw = () => {
    chips.replaceChildren(
      ...["all", ...areas].map((a) => h("button", { class: `chip ${a === active ? "chip-active" : "chip-soft"}`, onclick: () => ((active = a), draw()) }, a === "all" ? `Hammasi (${UPDATES.length})` : `${a} (${UPDATES.filter((u) => u.area === a).length})`))
    );
    list.replaceChildren(
      ...UPDATES.filter((u) => active === "all" || u.area === active).map((u) => {
        const card = updateCard(u);
        const topics = u.topics.filter((n) => n > 0).map((n) => TOPICS.find((t) => t.num === n)).filter(Boolean);
        card.append(h("div", { class: "small muted" }, u.topics.includes(0) ? "Qo'llanma kirish qismi" : "", u.topics.includes(0) && topics.length ? " · " : "", topics.map((t, i) => [i ? ", " : "", h("a", { href: `#/topics/${t.id}` }, `${t.num}-mavzu`)])));
        return card;
      })
    );
  };
  draw();
  mount(
    el,
    h("div", { class: "page-head" }, h("div", {}, h("h1", {}, "🔄 Dolzarb ma'lumotlar"), h("p", { class: "muted" }, `O'quv qo'llanmadagi eskirgan statistika va me'yoriy hujjatlarning yangi qiymatlari · tekshirilgan sana: ${CHECKED.split("-").reverse().join(".")}`))),
    h("div", { class: "alert alert-info" },
      "A.N. Xoliqulovning o'quv qo'llanmasi 2024-yilda nashr etilgan, lekin undagi ko'plab raqamlar (jahon turizmi, O'zbekistondagi mehmonxonalar soni, hisobot shakllari va h.k.) 2000–2010-yillarga oid. Quyidagi ma'lumotlar UN Tourism, WTTC, O'zbekiston Milliy statistika qo'mitasi, lex.uz va Markaziy bankning rasmiy ma'lumotlari asosida tekshirildi. Mavzu matnida eskirgan jumlalar ",
      h("mark", { class: "outdated" }, "sariq rangda"),
      " belgilangan va yonida yangi qiymat ko'rsatilgan. Amaliy hisob-kitoblarda (soliq stavkasi, BHM, eng kam ish haqi, asosiy stavka) shu ma'lumotlardan foydalaning."),
    chips,
    list,
    h("p", { class: "muted small" }, "Ma'lumotlar o'zgarishi mumkin: rasmiy manbalarni (stat.uz, lex.uz, cbu.uz, untourism.int) muntazam tekshirib boring. Yangilash: public/data/updates.js.")
  );
}

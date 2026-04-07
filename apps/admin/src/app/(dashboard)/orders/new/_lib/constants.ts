export const PREDEFINED_TAGS = [
  { id: "paid_100",   label: "Оплачено 100%", color: "#16a34a", bg: "#dcfce7" },
  { id: "paid_50",    label: "Оплачено 50%",  color: "#d97706", bg: "#fef3c7" },
  { id: "urgent",     label: "Терміново",     color: "#dc2626", bg: "#fee2e2" },
  { id: "vip",        label: "VIP",           color: "#7c3aed", bg: "#ede9fe" },
  { id: "new_client", label: "Новий клієнт",  color: "#0284c7", bg: "#e0f2fe" },
] as const;

export const DISCOUNT_TIERS = [
  { min: 10, max: 49,   pct: 5  },
  { min: 50, max: 99,   pct: 12 },
  { min: 100, max: null, pct: 15 },
];

export const DELIVERY_OPTIONS = [
  { id: "nova_poshta", label: "Нова Пошта",  desc: "2–3 робочих дні" },
  { id: "pickup",      label: "Самовивіз",   desc: "Львів, Джерельна, 69, офіс 10" },
];

export function getDiscount(qty: number): number {
  return DISCOUNT_TIERS.find(
    (t) => qty >= t.min && (t.max === null || qty <= t.max)
  )?.pct ?? 0;
}

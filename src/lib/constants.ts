export const PLATFORM_MAPPING: Record<string, string> = {
  PY: "PEYA",
  PEDIDOSYA: "PEYA",
  RAPPI: "RAPPI",
  MP: "MERCADOPAGO",
  MERCADOPAGO: "MERCADOPAGO",
  COUNTER: "COUNTER",
  LOCAL: "COUNTER",
  WHATSAPP: "WHATSAPP",
};

export const normalizePlatformName = (name: string) => {
  if (!name) return "COUNTER";
  const upper = name.toUpperCase();
  return PLATFORM_MAPPING[upper] || upper;
};

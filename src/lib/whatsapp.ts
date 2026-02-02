export type ReceiptSale = {
  id: string;
  clientName?: string | null;
  total: number | object; // Decimal handling
  date: Date | string;
  items: {
    quantity: number;
    product: { name: string };
    unitPrice: number | object;
  }[];
};

export function generateWhatsAppLink(sale: ReceiptSale, phone?: string) {
  // 1. Build Message
  const dateStr = new Date(sale.date).toLocaleDateString();
  let message = `🧾 *Ticket BurgerTilin* - ${dateStr}\n`;
  message += `👤 Cliente: ${sale.clientName || "Mostrador"}\n\n`;

  message += `*Pedido:*\n`;
  sale.items.forEach((item) => {
    message += `• ${item.quantity}x ${item.product.name} \n`;
    // Removed price per item to keep it clean, or we can add it.
  });

  message += `\n💰 *TOTAL: $${Number(sale.total).toFixed(2)}*\n`;
  message += `\nGracias por tu compra! 🍔`;

  // 2. Encode
  const encoded = encodeURIComponent(message);

  // 3. Return URL
  // If phone provided, use it. Otherwise empty string opens contact selector.
  const phoneParam = phone ? `phone=${phone}&` : "";
  return `https://wa.me/${phoneParam}?text=${encoded}`;
}

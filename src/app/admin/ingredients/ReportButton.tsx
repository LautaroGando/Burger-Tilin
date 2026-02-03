"use client";

import { Button } from "@/components/ui/button";
import { MessageSquare, Loader2 } from "lucide-react";
import { sendLowStockReport } from "@/app/actions/notification-actions";
import { useState } from "react";
import { toast } from "sonner";

export default function ReportButton() {
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    setLoading(true);
    const res = await sendLowStockReport();
    if (res.success && res.link) {
      window.open(res.link, "_blank");
    } else if (!res.success && res.message) {
      toast.info(res.message);
    } else {
      toast.error(res.error || "Error al generar reporte");
    }
    setLoading(false);
  };

  return (
    <Button
      variant="outline"
      disabled={loading}
      onClick={handleSend}
      className="w-full sm:w-auto h-12 border-green-500/20 bg-green-500/5 text-green-500 hover:bg-green-500/20 hover:border-green-500/50 font-bold uppercase tracking-wider"
    >
      {loading ? (
        <Loader2 className="animate-spin h-4 w-4 mr-2" />
      ) : (
        <MessageSquare className="mr-2 h-4 w-4" />
      )}
      Reporte WhatsApp
    </Button>
  );
}

"use client";

import { useRealtimeRefresh } from "@/hooks/use-realtime";

export default function KitchenRealtimeWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  useRealtimeRefresh(5000); // Poll every 5 seconds for kitchen
  return <>{children}</>;
}

"use client";

import { useRealtimeRefresh } from "@/hooks/use-realtime";

export default function SalesRealtimeWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  useRealtimeRefresh(15000); // Poll every 15 seconds for sales (less critical than kitchen)
  return <>{children}</>;
}

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

export function useRealtimeRefresh(intervalMs: number = 10000) {
  const router = useRouter();
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh(); // Triggers a server-side refresh in Next.js App Router
      setLastUpdate(new Date());
    }, intervalMs);

    return () => clearInterval(interval);
  }, [router, intervalMs]);

  return lastUpdate;
}

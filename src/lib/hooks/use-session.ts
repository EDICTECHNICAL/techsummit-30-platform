import { useState, useEffect } from "react";

export function useSession() {
  const [data, setData] = useState(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? { user: JSON.parse(raw) } : null;
    } catch {
      return null;
    }
  });
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    const handler = () => {
      try {
        const raw = localStorage.getItem("user");
        setData(raw ? { user: JSON.parse(raw) } : null);
      } catch {
        setData(null);
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  return { data, isPending };
}

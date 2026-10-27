"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "./api";
import type { Ticket } from "./types";

export function useTickets(username: string) {
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await api.listTickets(username);
      list.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || "") || b.id - a.id);
      setTickets(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطای ناشناخته");
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    setTickets(null);
    reload();
  }, [reload]);

  const upsert = useCallback((t: Ticket) => {
    setTickets((prev) => {
      const list = prev ?? [];
      const exists = list.some((x) => x.id === t.id);
      return exists ? list.map((x) => (x.id === t.id ? t : x)) : [t, ...list];
    });
  }, []);

  return { tickets, error, loading, reload, upsert };
}

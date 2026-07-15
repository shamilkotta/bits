import { db } from "@/db/client";
import { blockedApps, type BlockedApp } from "@/db/schema";
import { eq } from "drizzle-orm";
import { useCallback, useEffect, useMemo, useState } from "react";

export const DEFAULT_BLOCKABLE_APPS = [
  { id: "instagram", name: "Instagram", icon: "logo-instagram" },
  { id: "youtube", name: "YouTube", icon: "logo-youtube" },
  { id: "twitter", name: "X", icon: "logo-twitter" },
  { id: "tiktok", name: "TikTok", icon: "musical-notes-outline" },
  { id: "netflix", name: "Netflix", icon: "tv-outline" },
  { id: "games", name: "Games", icon: "game-controller-outline" },
] as const;

export type BlockableApp = BlockedApp;

export function useBlockedApps() {
  const [apps, setApps] = useState<BlockableApp[]>([]);
  const [loading, setLoading] = useState(true);

  const seedDefaults = useCallback(async () => {
    await Promise.all(
      DEFAULT_BLOCKABLE_APPS.map((app) =>
        db
          .insert(blockedApps)
          .values({
            id: app.id,
            name: app.name,
            icon: app.icon,
            isBlocked: 0,
            updatedAt: new Date().toISOString(),
          })
          .onConflictDoNothing(),
      ),
    );
  }, []);

  const refetch = useCallback(async () => {
    try {
      await seedDefaults();
      const result = await db.select().from(blockedApps);
      const sortOrder = new Map<string, number>(
        DEFAULT_BLOCKABLE_APPS.map((app, index) => [app.id, index]),
      );
      setApps(
        result.sort(
          (a, b) =>
            (sortOrder.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
            (sortOrder.get(b.id) ?? Number.MAX_SAFE_INTEGER),
        ),
      );
    } catch (e) {
      console.error("Failed to fetch blocked apps:", e);
    } finally {
      setLoading(false);
    }
  }, [seedDefaults]);

  const toggleAppBlock = useCallback(
    async (id: string, currentlyBlocked: boolean) => {
      try {
        await db
          .update(blockedApps)
          .set({
            isBlocked: currentlyBlocked ? 0 : 1,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(blockedApps.id, id));
        await refetch();
      } catch (e) {
        console.error("Failed to toggle app block:", e);
        throw e;
      }
    },
    [refetch],
  );

  const blockedCount = useMemo(
    () => apps.filter((app) => app.isBlocked === 1).length,
    [apps],
  );

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { apps, blockedCount, loading, refetch, toggleAppBlock };
}

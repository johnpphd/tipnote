import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  pagesCollection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "@/lib/firebase";
import type { Page } from "@/types";
import { type UserBrandId, parsePage } from "@/types";

interface UseSharedPagesResult {
  data: Page[] | undefined;
  isLoading: boolean;
  error: string | null;
}

export function useSharedPages(
  uid: UserBrandId | undefined,
): UseSharedPagesResult {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!uid) return;

    const q = query(
      pagesCollection(),
      where("sharedWithIds", "array-contains", uid),
      where("isDeleted", "==", false),
      orderBy("updatedAt", "desc"),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const pages = snapshot.docs.map((doc) =>
          parsePage(doc.id, doc.data()!),
        );
        queryClient.setQueryData(["sharedPages", uid], pages);
        queryClient.setQueryData(["sharedPages", uid, "error"], null);
      },
      (error) => {
        console.error("[useSharedPages] onSnapshot error:", error);
        queryClient.setQueryData(
          ["sharedPages", uid, "error"],
          error instanceof Error
            ? error.message
            : "Failed to load shared pages",
        );
      },
    );

    return unsubscribe;
  }, [uid, queryClient]);

  const { data } = useQuery<Page[]>({
    queryKey: ["sharedPages", uid],
    queryFn: () => [],
    enabled: !!uid,
    staleTime: Infinity,
  });

  const { data: error } = useQuery<string | null>({
    queryKey: ["sharedPages", uid, "error"],
    queryFn: () => null,
    enabled: !!uid,
    staleTime: Infinity,
  });

  return { data, isLoading: !data && !!uid, error: error ?? null };
}

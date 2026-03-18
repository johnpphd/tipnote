import { useQuery } from "@tanstack/react-query";
import { userProfilesCollection, getDocs, query, where } from "@/lib/firebase";
import type { UserProfile } from "@/types";
import { type UserBrandId, parseUserProfile } from "@/types";

export function useUserProfiles(uids: UserBrandId[]) {
  return useQuery<UserProfile[]>({
    queryKey: ["userProfiles", uids],
    queryFn: async () => {
      if (uids.length === 0) return [];
      // Firestore "in" queries support up to 30 items
      const batches: UserProfile[] = [];
      for (let i = 0; i < uids.length; i += 30) {
        const batch = uids.slice(i, i + 30);
        const q = query(userProfilesCollection(), where("uid", "in", batch));
        const snapshot = await getDocs(q);
        snapshot.docs.forEach((doc) => {
          batches.push(parseUserProfile(doc.data()!));
        });
      }
      return batches;
    },
    enabled: uids.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}

import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { WorkspaceBrandId } from "@/types";

const MIGRATION_KEY = "notion-clone-migrations-v1";

function getMigrated(): Set<string> {
  try {
    const raw = localStorage.getItem(MIGRATION_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function markMigrated(name: string) {
  const migrated = getMigrated();
  migrated.add(name);
  localStorage.setItem(MIGRATION_KEY, JSON.stringify([...migrated]));
}

export async function runMigrations(workspaceId: WorkspaceBrandId) {
  const migrated = getMigrated();

  // Migration: Update "Table View" -> "Default view" and show ALL columns
  if (!migrated.has("default-view-all-columns")) {
    try {
      const { collection, query, where, getDocs } =
        await import("firebase/firestore");
      const pagesRef = collection(db, "pages");
      const q = query(
        pagesRef,
        where("workspaceId", "==", workspaceId),
        where("type", "==", "database"),
        where("title", "==", "Article Reading List"),
      );
      const snap = await getDocs(q);
      if (snap.empty) {
        markMigrated("default-view-all-columns");
        return;
      }

      const pageDoc = snap.docs[0];
      const databaseId = pageDoc.data().databaseId;
      if (!databaseId) {
        markMigrated("default-view-all-columns");
        return;
      }

      const dbRef = doc(db, "databases", databaseId);
      const dbSnap = await getDoc(dbRef);
      if (!dbSnap.exists()) {
        markMigrated("default-view-all-columns");
        return;
      }

      const dbData = dbSnap.data();

      // Show ALL properties in the order defined by propertyOrder
      const allPropertyIds = dbData.propertyOrder as string[];

      const defaultViewId = dbData.defaultViewId;
      if (defaultViewId && allPropertyIds.length > 0) {
        const viewRef = doc(db, "dbViews", defaultViewId);
        await updateDoc(viewRef, {
          name: "Default view",
          "config.visibleProperties": allPropertyIds,
        });
      }

      markMigrated("default-view-all-columns");
    } catch (e) {
      console.warn("Migration default-view-all-columns failed:", e);
    }
  }

  // Migration: Add default sort by Date Added descending (newest first)
  if (!migrated.has("default-sort-date-desc")) {
    try {
      const { collection, query, where, getDocs } =
        await import("firebase/firestore");
      const pagesRef = collection(db, "pages");
      const q = query(
        pagesRef,
        where("workspaceId", "==", workspaceId),
        where("type", "==", "database"),
        where("title", "==", "Article Reading List"),
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const databaseId = snap.docs[0].data().databaseId;
        if (databaseId) {
          const dbRef = doc(db, "databases", databaseId);
          const dbSnap = await getDoc(dbRef);
          if (dbSnap.exists()) {
            const dbData = dbSnap.data();
            const props = dbData.properties as Record<
              string,
              { id: string; name: string }
            >;
            const dateAddedProp = Object.values(props).find(
              (p) => p.name === "Date Added",
            );
            if (dateAddedProp && dbData.defaultViewId) {
              const viewRef = doc(
                db,
                "dbViews",
                dbData.defaultViewId as string,
              );
              await updateDoc(viewRef, {
                "config.sorts": [
                  {
                    propertyId: dateAddedProp.id,
                    direction: "desc",
                  },
                ],
              });
            }
          }
        }
      }
      markMigrated("default-sort-date-desc");
    } catch (e) {
      console.warn("Migration default-sort-date-desc failed:", e);
    }
  }

  // Migration: Remove Board View (real Notion only has "Default view")
  if (!migrated.has("remove-board-view")) {
    try {
      const { collection, query, where, getDocs } =
        await import("firebase/firestore");
      const viewsRef = collection(db, "dbViews");
      const q = query(viewsRef, where("name", "==", "Board View"));
      const snap = await getDocs(q);
      for (const viewDoc of snap.docs) {
        await deleteDoc(doc(db, "dbViews", viewDoc.id));
      }
      markMigrated("remove-board-view");
    } catch (e) {
      console.warn("Migration remove-board-view failed:", e);
    }
  }
}

/**
 * Migration script: Flatten Firestore subcollections to top-level collections.
 *
 * Reads docs from:
 *   workspaces/{wsId}/pages     → pages/{pageId}
 *   workspaces/{wsId}/databases → databases/{dbId}
 *   workspaces/{wsId}/dbRows    → dbRows/{rowId}
 *   workspaces/{wsId}/dbViews   → dbViews/{viewId}
 *
 * Adds `workspaceId` field to each doc. Pages also get `ownerId = createdBy`.
 * Skips docs that already exist in the flat collection (idempotent).
 * Does NOT delete old subcollection docs.
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=path/to/key.json node scripts/migrate-to-flat-collections.mjs
 *
 * Or if using gcloud auth:
 *   node scripts/migrate-to-flat-collections.mjs
 */

import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

initializeApp({
  credential: applicationDefault(),
  projectId: "notion-clone-99968",
});

const db = getFirestore();

const BATCH_SIZE = 400; // Firestore batch limit is 500, leave headroom

async function migrateCollection(
  workspaceId,
  subcollectionName,
  flatCollectionName,
  extraFields = {}
) {
  const subcollectionRef = db.collection(
    `workspaces/${workspaceId}/${subcollectionName}`
  );
  const snapshot = await subcollectionRef.get();

  if (snapshot.empty) {
    console.log(`  ${subcollectionName}: 0 docs (skipped)`);
    return 0;
  }

  let batch = db.batch();
  let batchCount = 0;
  let totalMigrated = 0;
  let totalSkipped = 0;

  for (const doc of snapshot.docs) {
    const flatRef = db.collection(flatCollectionName).doc(doc.id);

    // Check if already exists (idempotent)
    const existing = await flatRef.get();
    if (existing.exists) {
      totalSkipped++;
      continue;
    }

    const data = doc.data();
    batch.set(flatRef, {
      ...data,
      workspaceId,
      ...extraFields(data),
    });

    batchCount++;
    totalMigrated++;

    if (batchCount >= BATCH_SIZE) {
      await batch.commit();
      batch = db.batch();
      batchCount = 0;
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }

  console.log(
    `  ${subcollectionName}: ${totalMigrated} migrated, ${totalSkipped} skipped (already exist)`
  );
  return totalMigrated;
}

async function main() {
  console.log("Fetching all workspaces...");
  const workspacesSnapshot = await db.collection("workspaces").get();
  console.log(`Found ${workspacesSnapshot.size} workspace(s)\n`);

  let totalPages = 0;
  let totalDatabases = 0;
  let totalRows = 0;
  let totalViews = 0;

  for (const wsDoc of workspacesSnapshot.docs) {
    const workspaceId = wsDoc.id;
    console.log(`Workspace: ${workspaceId}`);

    // Pages: add ownerId from createdBy
    totalPages += await migrateCollection(
      workspaceId,
      "pages",
      "pages",
      (data) => ({
        ownerId: data.createdBy || null,
      })
    );

    // Databases: just add workspaceId
    totalDatabases += await migrateCollection(
      workspaceId,
      "databases",
      "databases",
      () => ({})
    );

    // Database Rows: just add workspaceId
    totalRows += await migrateCollection(
      workspaceId,
      "dbRows",
      "dbRows",
      () => ({})
    );

    // Database Views: just add workspaceId
    totalViews += await migrateCollection(
      workspaceId,
      "dbViews",
      "dbViews",
      () => ({})
    );

    console.log("");
  }

  console.log("Migration complete!");
  console.log(`  Pages:     ${totalPages}`);
  console.log(`  Databases: ${totalDatabases}`);
  console.log(`  Rows:      ${totalRows}`);
  console.log(`  Views:     ${totalViews}`);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});

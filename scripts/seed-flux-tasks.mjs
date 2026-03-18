import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { randomUUID } from "crypto";

const WORKSPACE_ID = "1KMhx51gJLltPXA9H2FG";
const USER_ID = "vUDqM10vCLVf5SmIWZYgHN9BH252";

initializeApp({
  credential: applicationDefault(),
  projectId: "notion-clone-99968",
});

const db = getFirestore();

// Property IDs
const PROP_TITLE = randomUUID();
const PROP_APP = randomUUID();
const PROP_STATUS = randomUUID();
const PROP_DESCRIPTION = randomUUID();
const PROP_ASSIGNEE = randomUUID();
const PROP_PRIORITY = randomUUID();
const PROP_TASK_TYPE = randomUUID();
const PROP_DUE_DATE = randomUUID();

const properties = {
  [PROP_TITLE]: {
    id: PROP_TITLE,
    name: "Task name",
    type: "title",
  },
  [PROP_APP]: {
    id: PROP_APP,
    name: "App",
    type: "select",
    options: [{ id: randomUUID(), name: "Curator", color: "#2196F3" }],
  },
  [PROP_STATUS]: {
    id: PROP_STATUS,
    name: "Status",
    type: "select",
    options: [
      { id: randomUUID(), name: "Done", color: "#4CAF50" },
      { id: randomUUID(), name: "Not started", color: "#F44336" },
      { id: randomUUID(), name: "In progress", color: "#FF9800" },
    ],
  },
  [PROP_DESCRIPTION]: {
    id: PROP_DESCRIPTION,
    name: "Description",
    type: "text",
  },
  [PROP_ASSIGNEE]: {
    id: PROP_ASSIGNEE,
    name: "Assignee",
    type: "text",
  },
  [PROP_PRIORITY]: {
    id: PROP_PRIORITY,
    name: "Priority",
    type: "select",
    options: [
      { id: randomUUID(), name: "P1", color: "#F44336" },
      { id: randomUUID(), name: "P2", color: "#FF9800" },
      { id: randomUUID(), name: "P3", color: "#FF9800" },
      { id: randomUUID(), name: "P4", color: "#4CAF50" },
    ],
  },
  [PROP_TASK_TYPE]: {
    id: PROP_TASK_TYPE,
    name: "Task type",
    type: "select",
    options: [
      { id: randomUUID(), name: "bug", color: "#F44336" },
      { id: randomUUID(), name: "feature", color: "#2196F3" },
      { id: randomUUID(), name: "task", color: "#9E9E9E" },
    ],
  },
  [PROP_DUE_DATE]: {
    id: PROP_DUE_DATE,
    name: "Due date",
    type: "date",
  },
};

const propertyOrder = [
  PROP_TITLE,
  PROP_APP,
  PROP_STATUS,
  PROP_PRIORITY,
  PROP_TASK_TYPE,
  PROP_ASSIGNEE,
  PROP_DESCRIPTION,
  PROP_DUE_DATE,
];

const tasks = [
  {
    title: "Fix updating issues when deploying new strategies",
    app: "Curator",
    status: "Done",
    priority: "P1",
    taskType: "bug",
  },
  {
    title:
      "Enforce ADA Threshold v Liquidation Threshold relationship on Create Vault",
    app: "Curator",
    status: "Done",
    priority: "P1",
    taskType: "bug",
  },
  {
    title: "Improve descriptions on Pending Actions on Curator Dashboard",
    app: "Curator",
    status: "Done",
    priority: "P1",
    taskType: "bug",
  },
  {
    title: "Fix Execute button on Pending Actions on Curator Dashboard",
    app: "Curator",
    status: "Done",
    priority: "P1",
    taskType: "bug",
  },
  {
    title: "Fix Base Asset to Collateral Asset selection on vault creation",
    app: "Curator",
    status: "Done",
    priority: "P1",
    taskType: "bug",
  },
  {
    title: "Fix User Can't Create Vault",
    app: "Curator",
    status: "Not started",
    priority: "P1",
    taskType: "bug",
  },
  {
    title: "Untitled",
    app: "",
    status: "Not started",
    priority: "",
    taskType: "",
  },
];

async function seed() {
  const pagesCol = db.collection(`workspaces/${WORKSPACE_ID}/pages`);
  const dbsCol = db.collection(`workspaces/${WORKSPACE_ID}/databases`);
  const rowsCol = db.collection(`workspaces/${WORKSPACE_ID}/dbRows`);
  const viewsCol = db.collection(`workspaces/${WORKSPACE_ID}/dbViews`);

  // 1. Create database page
  console.log("Creating database page...");
  const pageRef = await pagesCol.add({
    title: "Flux Tasks",
    icon: "",
    coverImage: "",
    description: "",
    parentId: null,
    childOrder: [],
    type: "database",
    databaseId: null,
    isDbRow: false,
    parentDatabaseId: null,
    createdBy: USER_ID,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    isDeleted: false,
  });
  console.log(`  Page created: ${pageRef.id}`);

  // 2. Create database document
  console.log("Creating database...");
  const dbRef = await dbsCol.add({
    pageId: pageRef.id,
    properties,
    propertyOrder,
    defaultViewId: null,
  });
  console.log(`  Database created: ${dbRef.id}`);

  // 3. Create default table view
  console.log("Creating table view...");
  const viewRef = await viewsCol.add({
    databaseId: dbRef.id,
    name: "Table View",
    type: "table",
    config: {
      visibleProperties: propertyOrder,
      sorts: [],
      filters: [],
    },
  });
  console.log(`  View created: ${viewRef.id}`);

  // 4. Link page -> database and database -> default view
  console.log("Linking page <-> database <-> view...");
  await pageRef.update({ databaseId: dbRef.id });
  await dbRef.update({ defaultViewId: viewRef.id });

  // 5. Create rows
  console.log("Creating task rows...");
  for (const task of tasks) {
    // Create row page
    const rowPageRef = await pagesCol.add({
      title: task.title,
      icon: "",
      coverImage: "",
      description: "",
      parentId: null,
      childOrder: [],
      type: "page",
      databaseId: null,
      isDbRow: true,
      parentDatabaseId: dbRef.id,
      createdBy: USER_ID,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      isDeleted: false,
    });

    // Create row document
    const rowProps = {
      [PROP_TITLE]: task.title,
      [PROP_APP]: task.app || null,
      [PROP_STATUS]: task.status || null,
      [PROP_PRIORITY]: task.priority || null,
      [PROP_TASK_TYPE]: task.taskType || null,
      [PROP_ASSIGNEE]: null,
      [PROP_DESCRIPTION]: null,
      [PROP_DUE_DATE]: null,
    };

    await rowsCol.add({
      databaseId: dbRef.id,
      pageId: rowPageRef.id,
      properties: rowProps,
      createdBy: USER_ID,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    console.log(`  Row created: ${task.title}`);
  }

  console.log("\nDone! Flux Tasks database seeded successfully.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

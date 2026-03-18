import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { randomUUID } from "crypto";

const WORKSPACE_ID = "xslW5o35JCD8HGfA2c0I";
const USER_ID = "quEcF338veVA15YkAoJkYLzJ4tH3";

initializeApp({
  credential: applicationDefault(),
  projectId: "notion-clone-99968",
});

const db = getFirestore();

// Property IDs
const PROP_TITLE = randomUUID();
const PROP_COMPANY = randomUUID();
const PROP_DATE_CREATED = randomUUID();
const PROP_DESCRIPTION = randomUUID();
const PROP_STATUS = randomUUID();

const properties = {
  [PROP_TITLE]: {
    id: PROP_TITLE,
    name: "Name",
    type: "title",
  },
  [PROP_COMPANY]: {
    id: PROP_COMPANY,
    name: "Company",
    type: "text",
  },
  [PROP_DATE_CREATED]: {
    id: PROP_DATE_CREATED,
    name: "Date Created",
    type: "date",
  },
  [PROP_DESCRIPTION]: {
    id: PROP_DESCRIPTION,
    name: "Description",
    type: "text",
  },
  [PROP_STATUS]: {
    id: PROP_STATUS,
    name: "Status",
    type: "select",
    options: [
      { id: randomUUID(), name: "To Do", color: "#FF9800" },
      { id: randomUUID(), name: "Done 🙌", color: "#4CAF50" },
    ],
  },
};

const propertyOrder = [
  PROP_TITLE,
  PROP_COMPANY,
  PROP_DATE_CREATED,
  PROP_DESCRIPTION,
  PROP_STATUS,
];

function parseDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return Timestamp.fromDate(d);
}

// Data from the CSV (using _all.csv which has all rows)
const tasks = [
  {
    title: "",
    company: "",
    dateCreated: "July 11, 2020 7:32 PM",
    description: "",
    status: "",
  },
  {
    title: "Wood",
    company: "",
    dateCreated: "July 14, 2020 10:53 AM",
    description: "",
    status: "Done 🙌",
  },
  {
    title: "Electrician",
    company: "TE Electrical",
    dateCreated: "July 14, 2020 10:53 AM",
    description: "",
    status: "Done 🙌",
  },
  {
    title: "Baseboards",
    company: "Robert Trombetta",
    dateCreated: "July 14, 2020 10:53 AM",
    description:
      "Timeless Craftsman 45E2 11/16 in. x 4-1/2 in. Primed MDF Casing",
    status: "Done 🙌",
  },
  {
    title: "Carpet cleaning",
    company: "",
    dateCreated: "July 14, 2020 10:54 AM",
    description: "",
    status: "Done 🙌",
  },
  {
    title: "Set up computer",
    company: "",
    dateCreated: "July 14, 2020 10:55 AM",
    description: "",
    status: "Done 🙌",
  },
  {
    title: "Trade pictures",
    company: "",
    dateCreated: "July 14, 2020 10:56 AM",
    description: "",
    status: "Done 🙌",
  },
  {
    title: "Flooring",
    company: "Magnificent Floors",
    dateCreated: "July 14, 2020 11:13 AM",
    description: "",
    status: "Done 🙌",
  },
  {
    title: "Sell laptop",
    company: "",
    dateCreated: "August 16, 2020 9:48 AM",
    description: "",
    status: "Done 🙌",
  },
  {
    title: "Garage Opener Light",
    company: "",
    dateCreated: "January 25, 2026 10:35 AM",
    description: "",
    status: "To Do",
  },
  {
    title: "Tighten Dining Chairs",
    company: "",
    dateCreated: "January 25, 2026 10:36 AM",
    description: "",
    status: "To Do",
  },
  {
    title: "Sand post",
    company: "",
    dateCreated: "January 25, 2026 10:36 AM",
    description: "",
    status: "To Do",
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
    title: "Task List",
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

  // 4. Link page <-> database <-> view
  console.log("Linking page <-> database <-> view...");
  await pageRef.update({ databaseId: dbRef.id });
  await dbRef.update({ defaultViewId: viewRef.id, viewOrder: [viewRef.id] });

  // 5. Create rows
  console.log("Creating task rows...");
  for (const task of tasks) {
    const title = task.title || "Untitled";

    // Create row page
    const rowPageRef = await pagesCol.add({
      title,
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
      [PROP_TITLE]: title,
      [PROP_COMPANY]: task.company || null,
      [PROP_DATE_CREATED]: parseDate(task.dateCreated),
      [PROP_DESCRIPTION]: task.description || null,
      [PROP_STATUS]: task.status || null,
    };

    await rowsCol.add({
      databaseId: dbRef.id,
      pageId: rowPageRef.id,
      properties: rowProps,
      createdBy: USER_ID,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    console.log(`  Row created: ${title}`);
  }

  console.log("\nDone! Task List database seeded successfully.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

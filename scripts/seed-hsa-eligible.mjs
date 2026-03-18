import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { randomUUID } from "crypto";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const WORKSPACE_ID = "xslW5o35JCD8HGfA2c0I";
const USER_ID = "quEcF338veVA15YkAoJkYLzJ4tH3";

initializeApp({
  credential: applicationDefault(),
  projectId: "notion-clone-99968",
});

const db = getFirestore();

// --- CSV + subpage paths ---
const CSV_PATH =
  "/Users/dev/Downloads/ExportBlock-291e5489-5fe5-4c11-8e3d-f37557fd3d90-Part-1/HSA Eligible 530f3a755eee4c0a91627f89a66d07b2_all.csv";
const SUBPAGES_DIR =
  "/Users/dev/Downloads/ExportBlock-291e5489-5fe5-4c11-8e3d-f37557fd3d90-Part-1/HSA Eligible";

// --- Property IDs ---
const PROP_TITLE = randomUUID();
const PROP_BRANDS = randomUUID();
const PROP_CATEGORY = randomUUID();
const PROP_COMMON = randomUUID();

// --- Category colors (one per category) ---
const CATEGORY_COLORS = {
  Acne: "#FF9800",
  "Allergy & Sinus": "#2196F3",
  "Baby & Infant": "#E91E63",
  "Blood Pressure & Heart": "#F44336",
  Breastfeeding: "#9C27B0",
  "Cold Flu & Respiratory": "#00BCD4",
  "Diabetes Management": "#795548",
  Digestive: "#4CAF50",
  "Ear Care": "#3F51B5",
  "Eye Care": "#009688",
  "Family Planning & Sexual Health": "#673AB7",
  "Feminine Care": "#EC407A",
  "First Aid": "#F44336",
  "Foot Care": "#8BC34A",
  Incontinence: "#607D8B",
  Miscellaneous: "#9E9E9E",
  "Mobility & Support": "#FF5722",
  "Oral Care": "#00ACC1",
  "Pain & Fever": "#D32F2F",
  "Skin Conditions": "#AB47BC",
  "Sleep Aids": "#5C6BC0",
  "Smoking Cessation": "#78909C",
  "Sun Protection": "#FFC107",
};

// Build category select options
const categoryOptions = Object.entries(CATEGORY_COLORS).map(
  ([name, color]) => ({
    id: randomUUID(),
    name,
    color,
  })
);

const properties = {
  [PROP_TITLE]: {
    id: PROP_TITLE,
    name: "Item",
    type: "title",
  },
  [PROP_BRANDS]: {
    id: PROP_BRANDS,
    name: "Brands",
    type: "text",
  },
  [PROP_CATEGORY]: {
    id: PROP_CATEGORY,
    name: "Category",
    type: "select",
    options: categoryOptions,
  },
  [PROP_COMMON]: {
    id: PROP_COMMON,
    name: "Common",
    type: "checkbox",
  },
};

const propertyOrder = [PROP_TITLE, PROP_BRANDS, PROP_CATEGORY, PROP_COMMON];

// --- Simple CSV parser (handles quoted fields with commas) ---
function parseCSV() {
  const raw = readFileSync(CSV_PATH, "utf-8");
  const lines = raw.split("\n").filter((l) => l.trim());
  const headers = parseCSVLine(lines[0]);
  const records = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h.trim()] = (values[idx] || "").trim();
    });
    records.push(obj);
  }
  return records;
}

function parseCSVLine(line) {
  const fields = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

// --- Build TipTap content from markdown ---
function buildSubpageContent(itemName) {
  // Find the matching .md file in the subpages directory
  const files = readdirSync(SUBPAGES_DIR);
  // Match by item name prefix (filenames are truncated + have Notion IDs)
  const normalizedName = itemName.replace(/[/\\]/g, " ").replace(/"/g, "");
  const match = files.find((f) => {
    const fileBase = f.replace(/ [a-f0-9]{32}\.md$/, "");
    return fileBase === normalizedName || normalizedName.startsWith(fileBase);
  });

  if (!match) {
    // Return minimal TipTap content with just the title
    return {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 1 },
          content: [{ type: "text", text: itemName }],
        },
      ],
    };
  }

  const md = readFileSync(join(SUBPAGES_DIR, match), "utf-8");
  const lines = md.split("\n").filter((l) => l.trim());

  const nodes = [];
  for (const line of lines) {
    if (line.startsWith("# ")) {
      // Skip heading — it's the title and already stored in page.title
      continue;
    }
    // Property lines like "Brands: Tylenol"
    const colonIdx = line.indexOf(":");
    if (colonIdx > -1) {
      const key = line.slice(0, colonIdx).trim();
      const val = line.slice(colonIdx + 1).trim();
      nodes.push({
        type: "paragraph",
        content: [
          { type: "text", marks: [{ type: "bold" }], text: `${key}: ` },
          { type: "text", text: val || "—" },
        ],
      });
    } else {
      nodes.push({
        type: "paragraph",
        content: [{ type: "text", text: line }],
      });
    }
  }

  if (nodes.length === 0) {
    nodes.push({ type: "paragraph" });
  }

  return { type: "doc", content: nodes };
}

// --- Main seed function ---
async function seed() {
  const rows = parseCSV();
  console.log(`Parsed ${rows.length} items from CSV`);

  const pagesCol = db.collection(`workspaces/${WORKSPACE_ID}/pages`);
  const dbsCol = db.collection(`workspaces/${WORKSPACE_ID}/databases`);
  const rowsCol = db.collection(`workspaces/${WORKSPACE_ID}/dbRows`);
  const viewsCol = db.collection(`workspaces/${WORKSPACE_ID}/dbViews`);

  // 1. Create database page
  console.log("Creating database page...");
  const pageRef = await pagesCol.add({
    title: "HSA Eligible",
    icon: "💊",
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

  // 5. Create rows (batched for performance)
  console.log(`Creating ${rows.length} item rows...`);

  const BATCH_SIZE = 400; // Firestore limit is 500 ops per batch; each row = 2 ops
  let batchOps = [];
  let created = 0;

  for (const row of rows) {
    const itemName = row.Item || row.item || "";
    const brands = row.Brands || row.brands || "";
    const category = row.Category || row.category || "";
    const isCommon =
      (row.Common || row.common || "").trim().toLowerCase() === "yes";

    if (!itemName) continue;

    // Build TipTap content from subpage markdown
    const content = buildSubpageContent(itemName);

    // Create row page
    const rowPageRef = pagesCol.doc();
    const rowDocRef = rowsCol.doc();

    batchOps.push({
      pageRef: rowPageRef,
      pageData: {
        title: itemName,
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
        content,
      },
      rowRef: rowDocRef,
      rowData: {
        databaseId: dbRef.id,
        pageId: rowPageRef.id,
        properties: {
          [PROP_TITLE]: itemName,
          [PROP_BRANDS]: brands || null,
          [PROP_CATEGORY]: category || null,
          [PROP_COMMON]: isCommon,
        },
        createdBy: USER_ID,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
    });

    // Flush batch when it gets large
    if (batchOps.length >= BATCH_SIZE / 2) {
      const batch = db.batch();
      for (const op of batchOps) {
        batch.set(op.pageRef, op.pageData);
        batch.set(op.rowRef, op.rowData);
      }
      await batch.commit();
      created += batchOps.length;
      console.log(`  Committed ${created}/${rows.length} rows...`);
      batchOps = [];
    }
  }

  // Flush remaining
  if (batchOps.length > 0) {
    const batch = db.batch();
    for (const op of batchOps) {
      batch.set(op.pageRef, op.pageData);
      batch.set(op.rowRef, op.rowData);
    }
    await batch.commit();
    created += batchOps.length;
    console.log(`  Committed ${created}/${rows.length} rows.`);
  }

  console.log(`\nDone! HSA Eligible database seeded with ${created} items.`);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

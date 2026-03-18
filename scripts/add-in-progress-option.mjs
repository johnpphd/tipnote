import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { randomUUID } from "crypto";

initializeApp({
  credential: applicationDefault(),
  projectId: "notion-clone-99968",
});

const db = getFirestore();

const WORKSPACE_ID = "xslW5o35JCD8HGfA2c0I";
const DB_ID = "jMWEKR1Y0eDmtWBEMBa9";
const STATUS_PROP_ID = "dcd6b919-3368-465e-8252-f326c81dd9b2";

async function addOption() {
  const dbRef = db.doc(`workspaces/${WORKSPACE_ID}/databases/${DB_ID}`);
  const snap = await dbRef.get();
  const data = snap.data();
  const statusProp = data.properties[STATUS_PROP_ID];

  statusProp.options.push({
    id: randomUUID(),
    name: "In Progress",
    color: "#2196F3",
  });

  await dbRef.update({
    [`properties.${STATUS_PROP_ID}`]: statusProp,
  });

  console.log("Added 'In Progress' option to Status property.");
}

addOption().catch(console.error);

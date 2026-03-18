import * as admin from "firebase-admin";
import type { Request, Response } from "express";
import { createAuthCode } from "./oauth-store";

/**
 * Handles the POST from the authorization consent page.
 * Verifies the Firebase ID token, checks workspace membership,
 * creates an authorization code, and redirects back to the client.
 */
export async function handleAuthCallback(
  req: Request,
  res: Response
): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const {
    firebaseIdToken,
    workspaceId,
    state,
    codeChallenge,
    redirectUri,
    clientId,
    scope,
  } = req.body as {
    firebaseIdToken?: string;
    workspaceId?: string;
    state?: string;
    codeChallenge?: string;
    redirectUri?: string;
    clientId?: string;
    scope?: string;
  };

  if (!firebaseIdToken || !workspaceId || !redirectUri || !clientId) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  // Verify Firebase ID token server-side
  let userId: string;
  try {
    const decoded = await admin.auth().verifyIdToken(firebaseIdToken);
    userId = decoded.uid;
  } catch {
    res.status(401).json({ error: "Invalid Firebase token" });
    return;
  }

  // Verify workspace membership
  const workspaceDoc = await admin
    .firestore()
    .collection("workspaces")
    .doc(workspaceId)
    .get();

  if (!workspaceDoc.exists) {
    res.status(404).json({ error: "Workspace not found" });
    return;
  }

  const memberIds = workspaceDoc.data()?.memberIds as string[] | undefined;
  if (!memberIds?.includes(userId)) {
    res.status(403).json({ error: "Not a member of this workspace" });
    return;
  }

  // Create authorization code
  const rawCode = await createAuthCode({
    clientId,
    userId,
    workspaceId,
    redirectUri,
    codeChallenge: codeChallenge || "",
    scopes: scope ? scope.split(" ") : [],
  });

  // Build redirect URL back to the client (Claude.ai)
  const redirectUrl = new URL(redirectUri);
  redirectUrl.searchParams.set("code", rawCode);
  if (state) {
    redirectUrl.searchParams.set("state", state);
  }

  res.json({ redirectUrl: redirectUrl.toString() });
}

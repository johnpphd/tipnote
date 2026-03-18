import * as admin from "firebase-admin";
import { generateRandomToken, hashToken } from "./token-utils";

// --- Firestore collection names ---
const CLIENTS_COLLECTION = "mcpOAuthClients";
const AUTH_CODES_COLLECTION = "mcpAuthCodes";
const TOKENS_COLLECTION = "mcpTokens";

// --- Token lifetimes ---
const AUTH_CODE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const ACCESS_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function getDb() {
  return admin.firestore();
}

// --- Client Registration (DCR) ---

export interface StoredClient {
  clientId: string;
  clientSecret: string;
  clientName: string;
  redirectUris: string[];
  grantTypes: string[];
  responseTypes: string[];
  tokenEndpointAuthMethod: string;
  clientIdIssuedAt: number;
  clientSecretExpiresAt: number;
}

export async function storeClient(client: StoredClient): Promise<void> {
  await getDb().collection(CLIENTS_COLLECTION).doc(client.clientId).set(client);
}

export async function getClient(
  clientId: string
): Promise<StoredClient | undefined> {
  const doc = await getDb().collection(CLIENTS_COLLECTION).doc(clientId).get();
  if (!doc.exists) return undefined;
  return doc.data() as StoredClient;
}

// --- Authorization Codes ---

interface StoredAuthCode {
  codeHash: string;
  clientId: string;
  userId: string;
  workspaceId: string;
  redirectUri: string;
  codeChallenge: string;
  scopes: string[];
  expiresAt: admin.firestore.Timestamp;
  used: boolean;
}

export interface AuthCodeParams {
  clientId: string;
  userId: string;
  workspaceId: string;
  redirectUri: string;
  codeChallenge: string;
  scopes: string[];
}

/**
 * Create and store an authorization code. Returns the raw code (shown once).
 */
export async function createAuthCode(params: AuthCodeParams): Promise<string> {
  const rawCode = generateRandomToken(32);
  const codeHash = hashToken(rawCode);

  const doc: StoredAuthCode = {
    codeHash,
    clientId: params.clientId,
    userId: params.userId,
    workspaceId: params.workspaceId,
    redirectUri: params.redirectUri,
    codeChallenge: params.codeChallenge,
    scopes: params.scopes,
    expiresAt: admin.firestore.Timestamp.fromMillis(
      Date.now() + AUTH_CODE_TTL_MS
    ),
    used: false,
  };

  await getDb().collection(AUTH_CODES_COLLECTION).doc(codeHash).set(doc);
  return rawCode;
}

/**
 * Consume an authorization code (single-use). Returns the code data or null.
 */
export async function consumeAuthCode(
  rawCode: string
): Promise<Omit<StoredAuthCode, "codeHash" | "used"> | null> {
  const codeHash = hashToken(rawCode);
  const ref = getDb().collection(AUTH_CODES_COLLECTION).doc(codeHash);

  return admin.firestore().runTransaction(async (tx) => {
    const doc = await tx.get(ref);
    if (!doc.exists) return null;

    const data = doc.data() as StoredAuthCode;

    // Already used or expired
    if (data.used) return null;
    if (data.expiresAt.toMillis() < Date.now()) return null;

    // Mark as used
    tx.update(ref, { used: true });

    return {
      clientId: data.clientId,
      userId: data.userId,
      workspaceId: data.workspaceId,
      redirectUri: data.redirectUri,
      codeChallenge: data.codeChallenge,
      scopes: data.scopes,
      expiresAt: data.expiresAt,
    };
  });
}

// --- Access & Refresh Tokens ---

interface StoredToken {
  tokenHash: string;
  tokenType: "access" | "refresh";
  clientId: string;
  userId: string;
  workspaceId: string;
  scopes: string[];
  expiresAt: admin.firestore.Timestamp;
  isRevoked: boolean;
}

interface TokenPairParams {
  clientId: string;
  userId: string;
  workspaceId: string;
  scopes: string[];
}

/**
 * Create an access/refresh token pair. Returns raw tokens (shown once).
 */
export async function createTokenPair(
  params: TokenPairParams
): Promise<{ accessToken: string; refreshToken: string }> {
  const rawAccess = generateRandomToken(32);
  const rawRefresh = generateRandomToken(48);
  const accessHash = hashToken(rawAccess);
  const refreshHash = hashToken(rawRefresh);

  const batch = getDb().batch();

  batch.set(getDb().collection(TOKENS_COLLECTION).doc(accessHash), {
    tokenHash: accessHash,
    tokenType: "access",
    clientId: params.clientId,
    userId: params.userId,
    workspaceId: params.workspaceId,
    scopes: params.scopes,
    expiresAt: admin.firestore.Timestamp.fromMillis(
      Date.now() + ACCESS_TOKEN_TTL_MS
    ),
    isRevoked: false,
  } satisfies StoredToken);

  batch.set(getDb().collection(TOKENS_COLLECTION).doc(refreshHash), {
    tokenHash: refreshHash,
    tokenType: "refresh",
    clientId: params.clientId,
    userId: params.userId,
    workspaceId: params.workspaceId,
    scopes: params.scopes,
    expiresAt: admin.firestore.Timestamp.fromMillis(
      Date.now() + REFRESH_TOKEN_TTL_MS
    ),
    isRevoked: false,
  } satisfies StoredToken);

  await batch.commit();

  return { accessToken: rawAccess, refreshToken: rawRefresh };
}

/**
 * Look up a token by its raw value. Returns null if not found, expired, or revoked.
 */
export async function getValidToken(
  rawToken: string
): Promise<StoredToken | null> {
  const tokenHash = hashToken(rawToken);
  const doc = await getDb().collection(TOKENS_COLLECTION).doc(tokenHash).get();

  if (!doc.exists) return null;
  const data = doc.data() as StoredToken;

  if (data.isRevoked) return null;
  if (data.expiresAt.toMillis() < Date.now()) return null;

  return data;
}

/**
 * Revoke a token by its raw value.
 */
export async function revokeToken(rawToken: string): Promise<void> {
  const tokenHash = hashToken(rawToken);
  const ref = getDb().collection(TOKENS_COLLECTION).doc(tokenHash);
  const doc = await ref.get();
  if (doc.exists) {
    await ref.update({ isRevoked: true });
  }
}

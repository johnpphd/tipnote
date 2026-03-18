import type { Response } from "express";
import type {
  OAuthServerProvider,
  AuthorizationParams,
} from "@modelcontextprotocol/sdk/server/auth/provider.js";
import type { OAuthRegisteredClientsStore } from "@modelcontextprotocol/sdk/server/auth/clients.js";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import type {
  OAuthClientInformationFull,
  OAuthTokens,
  OAuthTokenRevocationRequest,
} from "@modelcontextprotocol/sdk/shared/auth.js";
import { randomUUID as uuidv4 } from "node:crypto";
import {
  storeClient,
  getClient,
  consumeAuthCode,
  createTokenPair,
  getValidToken,
  revokeToken,
} from "./oauth-store";
import { hashToken, generateRandomToken } from "./token-utils";
import { renderAuthorizePage } from "./auth-page";
import { BASE_URL } from "./config";

const ACCESS_TOKEN_EXPIRES_IN = 3600; // 1 hour, in seconds

/**
 * Firestore-backed client store for the MCP SDK's DCR flow.
 */
class FirestoreClientsStore implements OAuthRegisteredClientsStore {
  async getClient(
    clientId: string
  ): Promise<OAuthClientInformationFull | undefined> {
    const stored = await getClient(clientId);
    if (!stored) return undefined;

    return {
      client_id: stored.clientId,
      client_secret: stored.clientSecret,
      client_id_issued_at: stored.clientIdIssuedAt,
      client_secret_expires_at: stored.clientSecretExpiresAt,
      redirect_uris: stored.redirectUris as unknown as string[],
      client_name: stored.clientName,
      grant_types: stored.grantTypes,
      response_types: stored.responseTypes,
      token_endpoint_auth_method: stored.tokenEndpointAuthMethod,
    };
  }

  async registerClient(
    client: Omit<
      OAuthClientInformationFull,
      "client_id" | "client_id_issued_at"
    >
  ): Promise<OAuthClientInformationFull> {
    const clientId = uuidv4();
    const clientSecret = generateRandomToken(48);
    const now = Math.floor(Date.now() / 1000);

    await storeClient({
      clientId,
      clientSecret,
      clientName: client.client_name || "Unknown Client",
      redirectUris: (client.redirect_uris || []).map((u) => u.toString()),
      grantTypes: client.grant_types || ["authorization_code"],
      responseTypes: client.response_types || ["code"],
      tokenEndpointAuthMethod:
        client.token_endpoint_auth_method || "client_secret_post",
      clientIdIssuedAt: now,
      clientSecretExpiresAt: 0, // never expires
    });

    return {
      ...client,
      client_id: clientId,
      client_secret: clientSecret, // raw secret returned once
      client_id_issued_at: now,
      client_secret_expires_at: 0,
    };
  }
}

/**
 * OAuthServerProvider implementation backed by Firebase Auth + Firestore.
 */
export class NotionCloneOAuthProvider implements OAuthServerProvider {
  readonly clientsStore = new FirestoreClientsStore();

  /**
   * Serves the authorization consent page. The page handles Firebase Auth
   * login, workspace selection, and POSTs back to our callback endpoint.
   */
  async authorize(
    client: OAuthClientInformationFull,
    params: AuthorizationParams,
    res: Response
  ): Promise<void> {
    const html = renderAuthorizePage({
      clientName: client.client_name || "Unknown Client",
      callbackUrl: `${BASE_URL}/oauth/callback`,
      state: params.state || "",
      codeChallenge: params.codeChallenge,
      redirectUri: params.redirectUri,
      scope: (params.scopes || []).join(" "),
      clientId: client.client_id,
    });

    res.setHeader("Content-Type", "text/html");
    res.send(html);
  }

  /**
   * Returns the PKCE code challenge for a given authorization code.
   * The SDK uses this to verify the code_verifier on token exchange.
   */
  async challengeForAuthorizationCode(
    _client: OAuthClientInformationFull,
    authorizationCode: string
  ): Promise<string> {
    const codeData = await consumeAuthCode(authorizationCode);
    if (!codeData) {
      throw new Error("Invalid or expired authorization code");
    }

    // Store the consumed code data temporarily for exchangeAuthorizationCode
    // We use a module-level cache keyed by the code hash since the SDK
    // calls challengeForAuthorizationCode and exchangeAuthorizationCode
    // separately for the same code.
    const codeHash = hashToken(authorizationCode);
    pendingExchanges.set(codeHash, codeData);

    // Clean up stale entries after 30 seconds
    setTimeout(() => pendingExchanges.delete(codeHash), 30_000);

    return codeData.codeChallenge;
  }

  /**
   * Exchanges an authorization code for access + refresh tokens.
   */
  async exchangeAuthorizationCode(
    _client: OAuthClientInformationFull,
    authorizationCode: string
  ): Promise<OAuthTokens> {
    const codeHash = hashToken(authorizationCode);
    const codeData = pendingExchanges.get(codeHash);
    pendingExchanges.delete(codeHash);

    if (!codeData) {
      throw new Error("Authorization code not found or already consumed");
    }

    const { accessToken, refreshToken } = await createTokenPair({
      clientId: codeData.clientId,
      userId: codeData.userId,
      workspaceId: codeData.workspaceId,
      scopes: codeData.scopes,
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: "Bearer",
      expires_in: ACCESS_TOKEN_EXPIRES_IN,
    };
  }

  /**
   * Exchanges a refresh token for a new access token.
   */
  async exchangeRefreshToken(
    _client: OAuthClientInformationFull,
    refreshToken: string
  ): Promise<OAuthTokens> {
    const tokenData = await getValidToken(refreshToken);
    if (!tokenData || tokenData.tokenType !== "refresh") {
      throw new Error("Invalid or expired refresh token");
    }

    const { accessToken, refreshToken: newRefresh } = await createTokenPair({
      clientId: tokenData.clientId,
      userId: tokenData.userId,
      workspaceId: tokenData.workspaceId,
      scopes: tokenData.scopes,
    });

    // Revoke the old refresh token (rotation)
    await revokeToken(refreshToken);

    return {
      access_token: accessToken,
      refresh_token: newRefresh,
      token_type: "Bearer",
      expires_in: 3600,
    };
  }

  /**
   * Verifies an access token and returns auth info including userId and workspaceId.
   */
  async verifyAccessToken(token: string): Promise<AuthInfo> {
    const tokenData = await getValidToken(token);
    if (!tokenData || tokenData.tokenType !== "access") {
      throw new Error("Invalid or expired access token");
    }

    return {
      token,
      clientId: tokenData.clientId,
      scopes: tokenData.scopes,
      expiresAt: Math.floor(tokenData.expiresAt.toMillis() / 1000),
      extra: {
        userId: tokenData.userId,
        workspaceId: tokenData.workspaceId,
      },
    };
  }

  /**
   * Revokes an access or refresh token.
   */
  async revokeToken(
    _client: OAuthClientInformationFull,
    request: OAuthTokenRevocationRequest
  ): Promise<void> {
    await revokeToken(request.token);
  }
}

// Temporary in-memory cache for code data between challenge and exchange calls.
// This is safe for Firebase Functions because both calls happen in the same
// request lifecycle (the SDK handles the /oauth/token endpoint synchronously).
const pendingExchanges = new Map<
  string,
  {
    clientId: string;
    userId: string;
    workspaceId: string;
    redirectUri: string;
    codeChallenge: string;
    scopes: string[];
  }
>();

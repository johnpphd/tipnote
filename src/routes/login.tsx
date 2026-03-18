import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Box,
  Typography,
  Alert,
  Divider,
  Button,
  TextField,
} from "@mui/material";
import { signIn, signUp, signInWithGoogle } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import {
  createWorkspace,
  getOrCreateWorkspace,
} from "@/lib/database/workspace";
import { useAtom } from "jotai";
import { workspaceIdAtom } from "@/atoms/workspace";
import { UserBrandId } from "@/types";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [, setWorkspaceId] = useAtom(workspaceIdAtom);

  useEffect(() => {
    if (user && !loading) {
      void navigate({ to: "/w" });
    }
  }, [user, loading, navigate]);

  if (user && !loading) {
    return null;
  }

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      const user = await signInWithGoogle();
      const wsId = await getOrCreateWorkspace(
        UserBrandId.parse(user.uid),
        "My Workspace",
      );
      setWorkspaceId(wsId);
      void navigate({ to: "/w" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        const newUser = await signUp(email, password);
        const wsId = await createWorkspace(
          UserBrandId.parse(newUser.uid),
          "My Workspace",
        );
        setWorkspaceId(wsId);
      } else {
        await signIn(email, password);
      }
      void navigate({ to: "/w" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        width: "100%",
        bgcolor: "background.default",
      }}
    >
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          width: { xs: "100%", sm: 360 },
          maxWidth: 360,
          mx: { xs: 2, sm: 0 },
          p: { xs: 3, sm: 4 },
          borderRadius: 3,
          border: "1px solid rgba(255,255,255,0.1)",
          bgcolor: "background.paper",
        }}
      >
        <Typography variant="h3" sx={{ mb: 3, textAlign: "center" }}>
          {isSignUp ? "Create Account" : "Sign In"}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Button
          variant="outlined"
          fullWidth
          disabled={loading}
          onClick={handleGoogleSignIn}
          sx={{
            textTransform: "none",
            fontSize: "14px",
            py: 1.25,
            borderColor: "rgba(255,255,255,0.2)",
            color: "text.primary",
            "&:hover": {
              borderColor: "rgba(255,255,255,0.4)",
              bgcolor: "rgba(255,255,255,0.04)",
            },
          }}
        >
          Continue with Google
        </Button>

        <Divider sx={{ my: 2, color: "text.secondary", fontSize: 12 }}>
          OR
        </Divider>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            type="email"
            required
            size="small"
            fullWidth
          />
          <TextField
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
            required
            size="small"
            fullWidth
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading || !email || !password}
            sx={{
              mt: 1,
              textTransform: "none",
              fontSize: "14px",
              py: 1.25,
              bgcolor: "primary.main",
              "&:hover": { bgcolor: "primary.dark" },
            }}
          >
            {loading ? "Loading..." : isSignUp ? "Create Account" : "Sign In"}
          </Button>
        </Box>

        <Typography
          variant="body2"
          sx={{
            mt: 2,
            textAlign: "center",
            cursor: "pointer",
            "&:hover": { textDecoration: "underline" },
          }}
          onClick={() => setIsSignUp(!isSignUp)}
        >
          {isSignUp
            ? "Already have an account? Sign in"
            : "Need an account? Sign up"}
        </Typography>
      </Box>
    </Box>
  );
}

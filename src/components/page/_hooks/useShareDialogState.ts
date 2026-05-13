import { useState } from "react";
import type { ShareRole } from "@/types";

export function useShareDialogState() {
  const [publishLoading, setPublishLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<ShareRole>("viewer");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");

  return {
    publishLoading,
    setPublishLoading,
    copied,
    setCopied,
    email,
    setEmail,
    inviteRole,
    setInviteRole,
    inviteLoading,
    setInviteLoading,
    inviteError,
    setInviteError,
  };
}

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

// ⚠️ DEV BYPASS — set to false to re-enable auth
export const BYPASS_AUTH = true;

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (BYPASS_AUTH) return;
    if (!loading && !session) navigate("/auth", { replace: true });
  }, [session, loading, navigate]);

  if (BYPASS_AUTH) return <>{children}</>;

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <span className="font-mono text-muted-foreground text-sm animate-pulse">Loading...</span>
    </div>
  );

  if (!session) return null;

  return <>{children}</>;
}

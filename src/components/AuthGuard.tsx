import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) navigate("/auth", { replace: true });
  }, [session, loading, navigate]);

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <span className="font-mono text-muted-foreground text-sm animate-pulse">Loading...</span>
    </div>
  );

  if (!session) return null;

  return <>{children}</>;
}

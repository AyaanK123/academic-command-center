import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Sparkles, Loader2 } from "lucide-react";
import { useToast } from "../hooks/use-toast";

export default function Auth() {
  const { user, loading, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch {
      toast({
        title: "Login failed",
        description: "Unable to sign in with Google.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background overflow-hidden">
      {/* Background blur */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary glow-primary">
            <Sparkles className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold">Welcome to AcadSync 🎓</h1>
          <p className="mt-2 text-muted-foreground">
            Sign in with Google to continue
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-xl p-8">
          <button
            onClick={handleGoogleLogin}
            className="flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-border bg-background font-medium hover:bg-muted transition"
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              className="h-5 w-5"
            />
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowLeft, Loader2, Shield, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const authSchema = z.object({
  email: z.string().email("Email non valida"),
  password: z.string().min(6, "La password deve avere almeno 6 caratteri"),
});

const passwordSchema = z.object({
  password: z.string().min(6, "La password deve avere almeno 6 caratteri"),
});

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isPromoting, setIsPromoting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [isRecovery, setIsRecovery] = useState(() =>
    window.location.hash.includes("type=recovery") || window.location.search.includes("type=recovery")
  );
  
  const { signIn, signUp, user, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
        setIsLogin(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isLoading && user && !isRecovery) {
      navigate("/");
    }
  }, [user, isLoading, isRecovery, navigate]);

  const validateForm = () => {
    try {
      if (isRecovery) {
        passwordSchema.parse({ password });
      } else {
        authSchema.parse({ email, password });
      }
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: { email?: string; password?: string } = {};
        err.errors.forEach((error) => {
          if (error.path[0] === "email") newErrors.email = error.message;
          if (error.path[0] === "password") newErrors.password = error.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      toast({
        variant: "destructive",
        title: "Inserisci la tua email",
        description: "Inserisci l'indirizzo email per ricevere il link di reset.",
      });
      return;
    }

    setIsResetting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/admin/auth`,
      });
      if (error) {
        toast({
          variant: "destructive",
          title: "Errore",
          description: error.message,
        });
      } else {
        setResetSent(true);
        toast({
          title: "Email inviata",
          description: "Controlla la tua casella di posta per il link di reset.",
        });
      }
    } finally {
      setIsResetting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      if (isRecovery) {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) {
          toast({
            variant: "destructive",
            title: "Errore",
            description: error.message,
          });
        } else {
          toast({
            title: "Password aggiornata",
            description: "Ora puoi usare la nuova password per accedere.",
          });
          setIsRecovery(false);
          setPassword("");
          navigate("/");
        }
      } else if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            variant: "destructive",
            title: "Errore di accesso",
            description: error.message === "Invalid login credentials" 
              ? "Credenziali non valide" 
              : error.message,
          });
        } else {
          toast({
            title: "Benvenuto!",
            description: "Accesso effettuato con successo",
          });
          navigate("/");
        }
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          const errorMessage = error.message.includes("already registered")
            ? "Questo indirizzo email è già registrato"
            : error.message;
          toast({
            variant: "destructive",
            title: "Errore di registrazione",
            description: errorMessage,
          });
        } else {
          toast({
            title: "Registrazione completata",
            description: "Controlla la tua email per confermare l'account",
          });
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/50 to-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => { window.location.href = "/"; }}
          className="mb-6 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Torna al sito
        </Button>

        <div className="bg-card rounded-lg shadow-elegant p-8 border border-border">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mx-auto mb-4">
              <span className="text-primary-foreground font-display text-2xl">VP</span>
            </div>
            <h1 className="font-display text-2xl text-foreground mb-2">
              {isRecovery ? "Nuova password" : isLogin ? "Accedi" : "Registrati"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isRecovery
                ? "Imposta una nuova password per il tuo account"
                : isLogin
                ? "Accedi al pannello di amministrazione"
                : "Crea un nuovo account amministratore"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isRecovery && (
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@villaparis.it"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  disabled={isSubmitting}
                />
              </div>
              {errors.email && (
                <p className="text-destructive text-sm">{errors.email}</p>
              )}
            </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-destructive text-sm">{errors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isRecovery ? "Aggiornamento..." : isLogin ? "Accesso in corso..." : "Registrazione in corso..."}
                </>
              ) : isRecovery ? (
                "Aggiorna password"
              ) : isLogin ? (
                "Accedi"
              ) : (
                "Registrati"
              )}
            </Button>
          </form>

          {/* Forgot password */}
          {isLogin && !isRecovery && !resetSent && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={isResetting}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <KeyRound className="w-3.5 h-3.5" />
                {isResetting ? "Invio in corso..." : "Password dimenticata?"}
              </button>
            </div>
          )}

          {resetSent && (
            <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-md text-center">
              <p className="text-sm text-primary font-medium">
                Email di reset inviata! Controlla la tua casella di posta.
              </p>
            </div>
          )}

          {/* Toggle */}
          {!isRecovery && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => { setIsLogin(!isLogin); setResetSent(false); }}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isLogin
                ? "Non hai un account? Registrati"
                : "Hai già un account? Accedi"}
            </button>
          </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

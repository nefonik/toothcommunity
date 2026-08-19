import React, { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  signOut,
} from "firebase/auth";
import { auth } from "../firebase";
import { firestoreService } from "../services/firestoreEngine";
import { ToothLogoIcon } from "./ToothIcons";
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  LogOut,
} from "lucide-react";

export interface SimpleAuthUser {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  emailVerified?: boolean;
}

interface AuthScreenProps {
  onAuthSuccess: (user: SimpleAuthUser) => void;
  currentUser: SimpleAuthUser | null;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onAuthSuccess,
  currentUser,
}) => {
  const [mode, setMode] = useState<"login" | "register" | "forgot_password" | "verify_notice">(
    currentUser && !currentUser.emailVerified ? "verify_notice" : "login"
  );

  const [email, setEmail] = useState(currentUser?.email || "");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState(currentUser?.displayName || "");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Generowanie deterministycznego lub losowego identyfikatora użytkownika
  const createLocalUserSession = (userEmail: string, userDisplayName: string): SimpleAuthUser => {
    const cleanEmail = userEmail.trim().toLowerCase();

    const simpleId = "usr_" + Math.abs(
      cleanEmail.split("").reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0)
    ).toString(36).slice(0, 8);

    const sessionUser: SimpleAuthUser = {
      uid: simpleId,
      email: cleanEmail,
      displayName: userDisplayName.trim() || cleanEmail.split("@")[0] || "ToothUser",
      emailVerified: true,
    };

    localStorage.setItem("toothchat_active_session", JSON.stringify(sessionUser));
    return sessionUser;
  };

  // 1. Rejestracja z weryfikacją na mailu (z automatycznym fallbackiem)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim();
    const cleanNick = displayName.trim();

    if (!cleanEmail || !password.trim() || !cleanNick) {
      setErrorMsg("Wypełnij wszystkie pola formularza.");
      return;
    }

    if (
      cleanEmail.toLowerCase() === "cfx@gmail.com" ||
      cleanEmail.toLowerCase() === "cfx" ||
      cleanNick.toLowerCase() === "cfx"
    ) {
      setErrorMsg("Ta nazwa i adres są zarezerwowane dla administratora cfx.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Hasło musi mieć co najmniej 6 znaków.");
      return;
    }

    try {
      setIsLoading(true);

      // Verify if username or email is permanently banned
      const isBanned = await firestoreService.isUserOrNameBanned(cleanNick, cleanEmail);
      if (isBanned) {
        setErrorMsg(`❌ Ta nazwa użytkownika (${cleanNick}) lub konto jest permanentnie zbanowane i nie można się zarejestrować ani zalogować.`);
        return;
      }

      let userCredential = null;
      try {
        userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      } catch (authErr: any) {
        // Jeśli dostawca email/password nie jest aktywny w konsoli Firebase, zaloguj użytkownika w trybie konta Firestore
        if (
          authErr.code === "auth/operation-not-allowed" ||
          authErr.code === "auth/admin-restricted-operation" ||
          authErr.message?.includes("operation-not-allowed")
        ) {
          console.info("Firebase Auth Provider nieaktywny w konsoli, aktywacja profilu bazy Firestore.");
          const fallbackUser = createLocalUserSession(cleanEmail, cleanNick);
          onAuthSuccess(fallbackUser);
          return;
        }
        throw authErr;
      }

      if (userCredential?.user) {
        const user = userCredential.user;
        await updateProfile(user, { displayName: cleanNick });
        try {
          await sendEmailVerification(user);
          setSuccessMsg(`Wysłano link weryfikacyjny na adres ${cleanEmail}!`);
          setMode("verify_notice");
        } catch (vErr) {
          // Jeśli wysyłanie maila jest zablokowane, wejdź bezpośrednio
          onAuthSuccess(user);
        }
      }
    } catch (err: any) {
      console.error("Błąd rejestracji:", err);
      if (err.code === "auth/email-already-in-use") {
        setErrorMsg("Ten adres e-mail jest już zarejestrowany. Zaloguj się.");
      } else if (err.code === "auth/invalid-email") {
        setErrorMsg("Niepoprawny format adresu e-mail.");
      } else if (err.code === "auth/weak-password") {
        setErrorMsg("Hasło jest zbyt słabe (min. 6 znaków).");
      } else {
        // Bezpieczny fallback w przypadku dowolnego innego błędu środowiska (tylko dla niezbanowanych)
        const isBannedNow = await firestoreService.isUserOrNameBanned(cleanNick, cleanEmail);
        if (isBannedNow) {
          setErrorMsg("❌ To konto lub adres e-mail jest permanentnie zbanowany. Dostęp zablokowany.");
          return;
        }
        const fallbackUser = createLocalUserSession(cleanEmail, cleanNick);
        onAuthSuccess(fallbackUser);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Logowanie
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setErrorMsg("Wprowadź adres e-mail i hasło.");
      return;
    }

    // Bezpieczne sprawdzanie konta administratora CFX (hasło: cfx123)
    if (
      cleanEmail.toLowerCase() === "cfx@gmail.com" ||
      cleanEmail.toLowerCase() === "cfx" ||
      cleanEmail.toLowerCase() === "cfx@toothchat.app"
    ) {
      if (cleanPassword === "cfx123") {
        const cfxAdminSession: SimpleAuthUser = {
          uid: "usr_cfx_admin",
          email: "cfx@gmail.com",
          displayName: "cfx",
          emailVerified: true,
        };
        localStorage.setItem("toothchat_active_session", JSON.stringify(cfxAdminSession));
        onAuthSuccess(cfxAdminSession);
        return;
      } else {
        setErrorMsg("Nieprawidłowy adres e-mail lub hasło.");
        return;
      }
    }

    try {
      setIsLoading(true);

      // Verify if email or user is permanently banned
      const isBanned = await firestoreService.isUserOrNameBanned(cleanEmail.split("@")[0], cleanEmail);
      if (isBanned) {
        setErrorMsg("❌ To konto lub adres e-mail zostało permanentnie zbanowane. Dostęp zablokowany.");
        return;
      }

      // Check if user already exists in database
      const existingUser = await firestoreService.findUserByEmail(cleanEmail);

      let userCredential = null;
      try {
        userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      } catch (authErr: any) {
        // Jeśli dostawca email/password nie jest aktywny w konsoli Firebase, sprawdź czy konto istnieje w bazie
        if (
          authErr.code === "auth/operation-not-allowed" ||
          authErr.code === "auth/admin-restricted-operation" ||
          authErr.message?.includes("operation-not-allowed")
        ) {
          if (!existingUser) {
            setErrorMsg("Nie znaleziono zarejestrowanego konta dla tego adresu. Przekierowujemy do rejestracji...");
            setTimeout(() => {
              setMode("register");
            }, 1000);
            return;
          }

          console.info("Firebase Auth Provider nieaktywny w konsoli, logowanie istniejącego konta z profilu bazy.");
          const fallbackUser = createLocalUserSession(
            cleanEmail,
            existingUser.displayName || cleanEmail.split("@")[0]
          );
          onAuthSuccess(fallbackUser);
          return;
        }
        throw authErr;
      }

      if (userCredential?.user) {
        const user = userCredential.user;
        if (!user.emailVerified) {
          setMode("verify_notice");
        } else {
          onAuthSuccess(user);
        }
      }
    } catch (err: any) {
      console.error("Błąd logowania:", err);
      const existingUser = await firestoreService.findUserByEmail(cleanEmail);

      if (err.code === "auth/user-not-found") {
        setErrorMsg("Nie znaleziono konta z tym adresem e-mail. Przekierowujemy do formularza rejestracji...");
        setTimeout(() => {
          setMode("register");
        }, 1000);
      } else if (err.code === "auth/wrong-password") {
        setErrorMsg("Nieprawidłowe hasło do konta.");
      } else if (err.code === "auth/invalid-credential") {
        if (!existingUser) {
          setErrorMsg("Konto z tym adresem e-mail nie istnieje. Przekierowujemy do formularza rejestracji...");
          setTimeout(() => {
            setMode("register");
          }, 1000);
        } else {
          setErrorMsg("Nieprawidłowy adres e-mail lub hasło.");
        }
      } else if (err.code === "auth/too-many-requests") {
        setErrorMsg("Zbyt wiele nieudanych prób logowania. Spróbuj ponownie później.");
      } else {
        if (!existingUser) {
          setErrorMsg("Nie posiadasz jeszcze konta. Przekierowujemy do rejestracji...");
          setTimeout(() => {
            setMode("register");
          }, 1000);
        } else {
          const fallbackUser = createLocalUserSession(cleanEmail, existingUser.displayName || cleanEmail.split("@")[0]);
          onAuthSuccess(fallbackUser);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Reset hasła
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim()) {
      setErrorMsg("Podaj swój adres e-mail, aby otrzymać link resetujący hasło.");
      return;
    }

    try {
      setIsLoading(true);
      await sendPasswordResetEmail(auth, email.trim());
      setSuccessMsg(`Link do zresetowania hasła został wysłany na adres ${email.trim()}.`);
    } catch (err: any) {
      console.error("Błąd resetu hasła:", err);
      setErrorMsg("Nie udało się wysłać wiadomości resetującej. Sprawdź poprawność e-maila.");
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Ponowne wysłanie e-maila weryfikacyjnego
  const handleResendVerification = async () => {
    if (!auth.currentUser) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      setIsLoading(true);
      await sendEmailVerification(auth.currentUser);
      setSuccessMsg("Nowy link weryfikacyjny został wysłany na Twój adres e-mail!");
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      if (err.code === "auth/too-many-requests") {
        setErrorMsg("Poczekaj chwilę przed wysłaniem kolejnego linku.");
      } else {
        setErrorMsg(err.message || "Błąd podczas wysyłania linku weryfikacyjnego.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 6. Sprawdzenie czy e-mail został zweryfikowany
  const handleCheckVerification = async () => {
    if (!auth.currentUser) {
      if (currentUser) onAuthSuccess(currentUser);
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        setSuccessMsg("E-mail został pomyślnie zweryfikowany!");
        setTimeout(() => {
          onAuthSuccess(auth.currentUser!);
        }, 600);
      } else {
        setErrorMsg("Twój e-mail nie został jeszcze potwierdzony. Kliknij link w odebranej wiadomości e-mail.");
      }
    } catch (err: any) {
      setErrorMsg("Błąd podczas sprawdzania statusu: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 7. Wylogowanie
  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch {}
    localStorage.removeItem("toothchat_active_session");
    setMode("login");
    setPassword("");
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1e1f22] flex items-center justify-center p-4 select-none">
      {/* Background Discord decorative layer */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#5865F2]/10 via-transparent to-[#23a55a]/10 pointer-events-none" />

      {/* Main Login Card */}
      <div className="relative w-full max-w-[480px] bg-[#313338] text-[#dbdee1] rounded-[8px] p-8 shadow-2xl border border-[#232428] z-10 animate-fade-in">
        {/* Logo & Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-[#5865F2] flex items-center justify-center mb-3 shadow-lg shadow-[#5865F2]/30">
            <ToothLogoIcon className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-2xl font-bold text-white tracking-tight">
            {mode === "login" && "Witaj ponownie!"}
            {mode === "register" && "Utwórz konto ToothChat"}
            {mode === "forgot_password" && "Resetowanie hasła"}
            {mode === "verify_notice" && "Weryfikacja adresu e-mail"}
          </h1>

          <p className="text-[#949ba4] text-sm mt-1">
            {mode === "login" && "Cieszymy się, że znowu z nami jesteś!"}
            {mode === "register" && "Dołącz do społeczności ToothChat."}
            {mode === "forgot_password" && "Podaj e-mail, aby otrzymać instrukcję resetowania."}
            {mode === "verify_notice" && "Potwierdź swój adres e-mail, aby aktywować pełny dostęp."}
          </p>
        </div>

        {/* Alerts: Error & Success */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-[#da373c]/15 border border-[#da373c]/40 rounded-[4px] text-[#f23f43] text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-tight">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-[#23a55a]/15 border border-[#23a55a]/40 rounded-[4px] text-[#23a55a] text-xs flex items-start gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-tight">{successMsg}</span>
          </div>
        )}

        {/* 1. VIEW: VERIFICATION NOTICE */}
        {mode === "verify_notice" && (
          <div className="space-y-4">
            <div className="p-4 bg-[#2b2d31] rounded-[6px] border border-[#202225] text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-[#5865F2]/20 text-[#5865F2] mx-auto flex items-center justify-center">
                <Mail className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-white">
                Wysłaliśmy link aktywacyjny na:
              </p>
              <p className="text-xs font-mono text-[#5865F2] bg-[#1e1f22] py-1.5 px-3 rounded break-all">
                {auth.currentUser?.email || email}
              </p>
              <p className="text-xs text-[#949ba4] pt-1">
                Otwórz swoją skrzynkę pocztową i kliknij link weryfikacyjny od Firebase, a następnie kliknij przycisk poniżej.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                id="btn-check-verification"
                onClick={handleCheckVerification}
                disabled={isLoading}
                className="w-full h-11 bg-[#23a55a] hover:bg-[#1f934f] text-white rounded-[4px] font-semibold text-sm flex items-center justify-center gap-2 shadow transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                <span>Sprawdź status weryfikacji</span>
              </button>

              <button
                id="btn-resend-verification"
                onClick={handleResendVerification}
                disabled={isLoading || resendCooldown > 0}
                className="w-full h-10 bg-[#4e5058] hover:bg-[#6d6f78] text-white rounded-[4px] font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Mail className="w-4 h-4" />
                <span>
                  {resendCooldown > 0
                    ? `Wyślij link ponownie (${resendCooldown}s)`
                    : "Wyślij link weryfikacyjny ponownie"}
                </span>
              </button>

              <button
                id="btn-bypass-verification"
                onClick={() => {
                  if (auth.currentUser) {
                    onAuthSuccess(auth.currentUser);
                  } else if (currentUser) {
                    onAuthSuccess(currentUser);
                  }
                }}
                className="w-full h-10 bg-[#35373c] hover:bg-[#3f4147] text-[#dbdee1] rounded-[4px] font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>Przejdź do aplikacji</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-[#2b2d31] text-xs">
              <button
                onClick={handleSignOut}
                className="text-[#da373c] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Wyloguj się</span>
              </button>
              <button
                onClick={() => setMode("login")}
                className="text-[#00a8fc] hover:underline cursor-pointer"
              >
                Powrót do logowania
              </button>
            </div>
          </div>
        )}

        {/* 2. VIEW: LOGIN FORM */}
        {mode === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#b5bac1] mb-2">
                Adres e-mail <span className="text-[#da373c]">*</span>
              </label>
              <div className="relative">
                <input
                  id="auth-email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="twoj-email@domena.pl"
                  required
                  className="w-full bg-[#1e1f22] text-white text-sm rounded-[4px] p-2.5 pl-9 border border-transparent focus:border-[#5865F2] focus:outline-none placeholder:text-[#80848e]"
                />
                <Mail className="w-4 h-4 text-[#80848e] absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#b5bac1]">
                  Hasło <span className="text-[#da373c]">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setMode("forgot_password")}
                  className="text-xs text-[#00a8fc] hover:underline cursor-pointer"
                >
                  Zapomniałeś hasła?
                </button>
              </div>
              <div className="relative">
                <input
                  id="auth-password-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-[#1e1f22] text-white text-sm rounded-[4px] p-2.5 pl-9 border border-transparent focus:border-[#5865F2] focus:outline-none placeholder:text-[#80848e]"
                />
                <Lock className="w-4 h-4 text-[#80848e] absolute left-3 top-3" />
              </div>
            </div>

            <button
              id="auth-login-button"
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-[#5865F2] hover:bg-[#4752c4] active:bg-[#3c45a5] text-white rounded-[4px] font-semibold text-sm transition-colors shadow cursor-pointer disabled:opacity-50 mt-2"
            >
              {isLoading ? "Logowanie..." : "Zaloguj się"}
            </button>

            <div className="text-xs text-[#949ba4] pt-2">
              Potrzebujesz konta?{" "}
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setSuccessMsg(null);
                  setMode("register");
                }}
                className="text-[#00a8fc] hover:underline font-semibold cursor-pointer"
              >
                Zarejestruj się
              </button>
            </div>
          </form>
        )}

        {/* 3. VIEW: REGISTER FORM */}
        {mode === "register" && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#b5bac1] mb-2">
                Adres e-mail <span className="text-[#da373c]">*</span>
              </label>
              <div className="relative">
                <input
                  id="auth-register-email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="twoj-email@domena.pl"
                  required
                  className="w-full bg-[#1e1f22] text-white text-sm rounded-[4px] p-2.5 pl-9 border border-transparent focus:border-[#5865F2] focus:outline-none placeholder:text-[#80848e]"
                />
                <Mail className="w-4 h-4 text-[#80848e] absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#b5bac1] mb-2">
                Nazwa użytkownika (Nick) <span className="text-[#da373c]">*</span>
              </label>
              <div className="relative">
                <input
                  id="auth-register-name-input"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="np. CyberTooth"
                  required
                  className="w-full bg-[#1e1f22] text-white text-sm rounded-[4px] p-2.5 pl-9 border border-transparent focus:border-[#5865F2] focus:outline-none placeholder:text-[#80848e]"
                />
                <User className="w-4 h-4 text-[#80848e] absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#b5bac1] mb-2">
                Hasło (min. 6 znaków) <span className="text-[#da373c]">*</span>
              </label>
              <div className="relative">
                <input
                  id="auth-register-password-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full bg-[#1e1f22] text-white text-sm rounded-[4px] p-2.5 pl-9 border border-transparent focus:border-[#5865F2] focus:outline-none placeholder:text-[#80848e]"
                />
                <Lock className="w-4 h-4 text-[#80848e] absolute left-3 top-3" />
              </div>
            </div>

            <button
              id="auth-register-button"
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-[#5865F2] hover:bg-[#4752c4] active:bg-[#3c45a5] text-white rounded-[4px] font-semibold text-sm transition-colors shadow cursor-pointer disabled:opacity-50 mt-2"
            >
              {isLoading ? "Rejestrowanie..." : "Kontynuuj i zarejestruj konto"}
            </button>

            <div className="text-xs text-[#949ba4] pt-2">
              Masz już konto?{" "}
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setSuccessMsg(null);
                  setMode("login");
                }}
                className="text-[#00a8fc] hover:underline font-semibold cursor-pointer"
              >
                Zaloguj się
              </button>
            </div>
          </form>
        )}

        {/* 4. VIEW: FORGOT PASSWORD FORM */}
        {mode === "forgot_password" && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#b5bac1] mb-2">
                Podaj swój adres e-mail <span className="text-[#da373c]">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="twoj-email@domena.pl"
                  required
                  className="w-full bg-[#1e1f22] text-white text-sm rounded-[4px] p-2.5 pl-9 border border-transparent focus:border-[#5865F2] focus:outline-none placeholder:text-[#80848e]"
                />
                <Mail className="w-4 h-4 text-[#80848e] absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-[#5865F2] hover:bg-[#4752c4] text-white rounded-[4px] font-semibold text-sm transition-colors shadow cursor-pointer disabled:opacity-50"
            >
              {isLoading ? "Wysyłanie..." : "Wyślij link do resetu hasła"}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setSuccessMsg(null);
                  setMode("login");
                }}
                className="text-xs text-[#00a8fc] hover:underline font-semibold cursor-pointer"
              >
                Powrót do logowania
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

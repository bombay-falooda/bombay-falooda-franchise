"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { ResultDialog } from "@/components/result-dialog";
import { CountryCodePicker } from "@/components/country-code-picker";
import { apiRequest, type LoginResponse, type PhoneOtpResponse } from "@/lib/api";
import { saveAuthSession } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [countryDialCode, setCountryDialCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loginOtpToken, setLoginOtpToken] = useState("");
  const [step, setStep] = useState<"PHONE" | "OTP">("PHONE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const GOOGLE_CLIENT_ID =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    "594662082129-hoq7tdd4hpjl50kn12sjnl5bqvg27e26.apps.googleusercontent.com";

  useState(() => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("bf_franchise_two_factor_token");
      sessionStorage.removeItem("bf_franchise_dev_otp");

      // Dynamically load Google Identity Services
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if ((window as any).google?.accounts?.id) {
          (window as any).google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleCredentialResponse,
          });
        }
      };
      document.body.appendChild(script);
    }
  });

  async function handleGoogleCredentialResponse(googleResponse: { credential?: string }) {
    setError("");
    setLoading(true);

    try {
      const response = await apiRequest<LoginResponse>("/auth/google", {
        method: "POST",
        auth: false,
        body: {
          credential: googleResponse.credential,
          portal: "franchise",
        },
      });

      if ("status" in response && response.status === "2FA_REQUIRED") {
        sessionStorage.setItem("bf_franchise_two_factor_token", response.twoFactorToken);
        if (response.devOtp) {
          sessionStorage.setItem("bf_franchise_dev_otp", response.devOtp);
        }
        router.push("/verify-2fa");
        return;
      }

      if ("accessToken" in response) {
        if (response.user.role !== "FRANCHISE_OWNER") {
          setError("Only franchise owner accounts can access this portal.");
          return;
        }

        saveAuthSession(response);
        router.push("/dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google authentication failed");
    } finally {
      setLoading(false);
    }
  }

  function continueWithGoogle() {
    if ((window as any).google?.accounts?.id) {
      (window as any).google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          void handleGoogleCredentialResponse({ credential: "" });
        }
      });
    } else {
      void handleGoogleCredentialResponse({ credential: "" });
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (step === "PHONE") {
        const fullPhone = `${countryDialCode}${phone.trim().replace(/^0+/, "")}`;
        const response = await apiRequest<PhoneOtpResponse>("/auth/request-login-otp", {
          method: "POST",
          auth: false,
          body: { phone: fullPhone },
        });

        if ("status" in response && response.status === "2FA_REQUIRED") {
          sessionStorage.setItem("bf_franchise_two_factor_token", response.twoFactorToken);
          if (response.devOtp) {
            sessionStorage.setItem("bf_franchise_dev_otp", response.devOtp);
          }
          router.push("/verify-2fa");
          return;
        }

        setLoginOtpToken(response.loginOtpToken);
        setDevOtp(response.devOtp || "");
        setStep("OTP");
        return;
      }

      const response = await apiRequest<LoginResponse>("/auth/verify-login-otp", {
        method: "POST",
        auth: false,
        body: { loginOtpToken, otp },
      });

      if ("status" in response && response.status === "2FA_REQUIRED") {
        sessionStorage.setItem("bf_franchise_two_factor_token", response.twoFactorToken);
        if (response.devOtp) {
          sessionStorage.setItem("bf_franchise_dev_otp", response.devOtp);
        }
        router.push("/verify-2fa");
        return;
      }

      if ("accessToken" in response) {
        if (response.user.role !== "FRANCHISE_OWNER") {
          setError("Only franchise owner accounts can access this portal.");
          return;
        }

        saveAuthSession(response);
        router.push("/dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#eef3ff] px-4 py-5">
      <div className="grid min-h-[620px] w-full max-w-5xl overflow-hidden rounded-[10px] border border-[#d8e1f7] bg-white shadow-[0_22px_58px_rgba(29,68,190,0.14)] lg:grid-cols-[1.02fr_0.98fr]">
        <section className="relative hidden overflow-hidden bg-[#3157f4] p-7 text-white lg:block">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0)_30%,rgba(255,255,255,0.22)_30%,rgba(255,255,255,0.08)_47%,rgba(255,255,255,0)_47%),linear-gradient(155deg,rgba(19,57,221,0)_0%,rgba(19,57,221,0)_48%,rgba(124,151,255,0.48)_48%,rgba(124,151,255,0.14)_64%,rgba(19,57,221,0)_64%)]" />
          <div className="absolute -bottom-12 -left-16 h-[470px] w-[470px] rotate-45 bg-[#2147df]/50" />
          <div className="absolute bottom-36 left-56 h-44 w-44 rotate-45 bg-white/22" />
          <div className="relative z-10">
            <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-white/14">
              <Image src="/bombay-falooda-logo.jpeg" alt="Bombay Falooda" width={34} height={34} className="h-7 w-7 rounded-[6px] object-cover" />
            </div>
            <div className="mt-20 pl-9">
              <h1 className="text-xl font-semibold">Designed for Franchise Owners</h1>
              <p className="mt-3 max-w-xs text-xs font-medium leading-5 text-white/62">
                Track sales, manage outlets and grow your Bombay Falooda operations from anywhere.
              </p>
              <div className="mt-14 flex items-center gap-1">
                <span className="h-1.5 w-6 rounded-full bg-white/70" />
                <span className="h-1.5 w-1.5 rounded-full bg-white/35" />
                <span className="h-1.5 w-1.5 rounded-full bg-white/35" />
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-32 w-[455px] rounded-t-[12px] bg-white/96 shadow-[0_20px_58px_rgba(20,45,130,0.18)]">
            <div className="flex h-14 items-center gap-4 border-b border-[#edf1fb] px-5 text-[#25304a]">
              <div className="flex h-9 w-9 items-center justify-center rounded-[9px] bg-[#3157f4]/10 text-sm font-black text-[#3157f4]">BF</div>
              <div className="font-semibold">Outlet Performance File</div>
              <div className="ml-auto h-9 w-9 overflow-hidden rounded-full border-4 border-white bg-[#f6d9c8] shadow-lg">
                <div className="h-full w-full bg-[radial-gradient(circle_at_50%_28%,#4b2d24_0_16%,transparent_17%),linear-gradient(#f2c7aa,#e6a984)]" />
              </div>
            </div>
            <div className="flex">
              <div className="flex w-16 flex-col items-center gap-5 bg-[#244de6] py-8">
                {["", "", "", "", ""].map((_, index) => (
                  <span key={index} className={`h-8 w-8 rounded-[8px] ${index === 0 ? "bg-white/24" : "bg-white/12"}`} />
                ))}
              </div>
              <div className="flex-1 p-5">
                <div className="grid grid-cols-7 gap-3">
                  {Array.from({ length: 35 }).map((_, index) => (
                    <span key={index} className="h-4 rounded-full bg-[#eef1f8]" />
                  ))}
                </div>
                <div className="mt-6 space-y-3">
                  {Array.from({ length: 7 }).map((_, index) => (
                    <div key={index} className="grid grid-cols-[28px_1fr_1fr_1fr] gap-4 text-[10px] text-[#98a2bb]">
                      <span>{index + 1}</span>
                      <span className="h-4 rounded-full bg-[#edf1f8]" />
                      <span className="h-4 rounded-full bg-[#edf1f8]" />
                      <span className="h-4 rounded-full bg-[#edf1f8]" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-7 py-8 sm:px-10">
          <div className="w-full max-w-[350px]">
            <div className="mb-12 lg:hidden">
              <Image src="/bombay-falooda-logo.jpeg" alt="Bombay Falooda" width={62} height={62} className="rounded-[16px] object-cover shadow-sm" />
            </div>
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-[#333845]">Login</h2>
              <p className="mt-3 text-sm font-medium leading-6 text-[#8a92a6]">
                Enter your registered owner phone number. OTP comes first,
                then Authenticator App verification if enabled.
              </p>
            </div>
            <form className="space-y-5" onSubmit={submit}>
              {step === "PHONE" ? (
                <div>
                  <label className="mb-2 block text-xs font-semibold text-[#5b6378]" htmlFor="phone">Phone number</label>
                  <div className="flex items-center gap-2">
                    <CountryCodePicker
                      value={countryDialCode}
                      onChange={setCountryDialCode}
                    />
                    <input
                      id="phone"
                      type="tel"
                      className="h-11 min-w-0 flex-1 rounded-[8px] border border-[#e3e8f4] bg-white px-4 text-sm font-medium text-[#202638] outline-none transition focus:border-[#3157f4] focus:shadow-[0_0_0_4px_rgba(49,87,244,0.1)]"
                      placeholder="99999 99999"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      required
                    />
                  </div>
                </div>
              ) : (
                <>
                  {devOtp ? (
                    <div className="rounded-[12px] border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                      Development phone OTP: <span className="font-semibold">{devOtp}</span>
                    </div>
                  ) : null}
                  <div>
                    <label className="mb-2 block text-xs font-semibold text-[#5b6378]" htmlFor="otp">Phone OTP</label>
                    <input id="otp" className="h-11 w-full rounded-[8px] border border-[#e3e8f4] bg-white px-4 text-center text-lg tracking-[0.4em] text-[#202638] outline-none transition focus:border-[#3157f4] focus:shadow-[0_0_0_4px_rgba(49,87,244,0.1)]" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value)} />
                  </div>
                </>
              )}
              <button className="h-11 w-full rounded-[8px] bg-[#3157f4] text-sm font-semibold text-white shadow-[0_14px_28px_rgba(49,87,244,0.22)] transition hover:bg-[#294be0] disabled:opacity-60" disabled={loading} type="submit">
                {loading ? "Please wait..." : step === "PHONE" ? "Send OTP" : "Verify OTP"}
              </button>
            </form>
            <p className="mt-5 text-xs font-medium text-[#5b6378]">
              Bombay Falooda owner account access only. Authenticator App may be required after OTP.
            </p>
            <div className="my-5 flex items-center gap-4">
              <span className="h-px flex-1 bg-[#e8edf6]" />
              <span className="text-xs text-[#a7afc0]">or continue with</span>
              <span className="h-px flex-1 bg-[#e8edf6]" />
            </div>
            <button
              type="button"
              onClick={continueWithGoogle}
              disabled={loading}
              className="flex h-11 w-full items-center justify-center gap-3 rounded-[8px] border border-[#e3e8f4] bg-white text-sm font-semibold text-[#1e293b] shadow-2xs hover:bg-slate-50 transition active:scale-[0.99] disabled:opacity-50"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>
        </section>
      </div>
      <ResultDialog open={!!error} title="Login failed" message={error} tone="error" onPrimary={() => setError("")} />
    </main>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";
import { loginAdmin } from "../auth/auth";
import { useAuth } from "../auth/authContext";
import { useTranslation } from "react-i18next";

export default function LoginPage() {
  const nav = useNavigate();
  const { login } = useAuth();
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await loginAdmin({
        email,
        password,
        fcmToken: "web-fcm-placeholder",
      });

      // 🔥 تحديث auth state (بدون refresh)
      // ملاحظة: لازم loginAdmin يرجّع { token } أو تعدّل السطر حسب response الحقيقي
      login(res.token);

      nav("/", { replace: true });
    } catch (err) {
      setError(err?.message || t("auth.login.errors.generic"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      left={
        <>
          {/* Logo + Name */}
          <div className="inline-flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-[#4880FF]/20 border border-white/10 grid place-items-center">
              <span className="font-semibold text-[#4880FF]">M</span>
            </div>
            <div>
              <div className="text-lg font-semibold">{t("auth.brand.title")}</div>
              <div className="text-sm text-white/55">{t("auth.brand.subtitle")}</div>
            </div>
          </div>

          {/* Title */}
          <h1 className="mt-10 text-4xl font-semibold leading-tight">
            {t("auth.hero.headline")}{" "}
            <span className="text-white/60">{t("auth.hero.highlight")}</span>
          </h1>

          {/* Description */}
          <p className="mt-4 max-w-lg text-base text-white/60 leading-relaxed">
            {t("auth.hero.description")}
          </p>

          {/* Features */}
          <div className="mt-8 grid max-w-lg grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              {
                title: t("auth.features.liveTracking"),
                desc: t("auth.features.liveTrackingDesc"),
              },
              {
                title: t("auth.features.driverVerification"),
                desc: t("auth.features.driverVerificationDesc"),
              },
              {
                title: t("auth.features.pricingRules"),
                desc: t("auth.features.pricingRulesDesc"),
              },
              {
                title: t("auth.features.roles"),
                desc: t("auth.features.rolesDesc"),
              },
            ].map((x) => (
              <div
                key={x.title}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
              >
                <div className="font-medium">{x.title}</div>
                <div className="mt-1 text-sm text-white/55">{x.desc}</div>
              </div>
            ))}
          </div>
        </>
      }
    >
      {/* Right side – Login Card */}
      <div className="w-full max-w-[520px]">
        <div className="rounded-3xl border border-white/10 bg-[#0f1a2f]/70 backdrop-blur-xl shadow-[0_24px_80px_-30px_rgba(0,0,0,0.7)]">
          <div className="px-8 py-7">
            <h2 className="text-2xl font-semibold">{t("auth.login.title")}</h2>
            <p className="mt-1 text-sm text-white/55">{t("auth.login.subtitle")}</p>

            {/* Error */}
            {error && (
              <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            <form onSubmit={onSubmit} className="mt-7 space-y-5">
              {/* Email */}
              <div>
                <label className="text-sm text-white/70">{t("auth.login.email")}</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  required
                  placeholder={t("auth.login.emailPlaceholder")}
                  className="
                    mt-2 w-full rounded-2xl border border-white/10
                    bg-[#0b1424] px-4 py-3.5 text-sm text-white
                    placeholder:text-white/30 outline-none
                    focus:border-[#4880FF]/70
                    focus:ring-4 focus:ring-[#4880FF]/10
                  "
                />
              </div>

              {/* Password */}
              <div>
                <label className="text-sm text-white/70">{t("auth.login.password")}</label>
                <div className="relative mt-2">
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={show ? "text" : "password"}
                    required
                    placeholder={t("auth.login.passwordPlaceholder")}
                    className="
                      w-full rounded-2xl border border-white/10
                      bg-[#0b1424] px-4 py-3.5 pr-14 text-sm text-white
                      placeholder:text-white/30 outline-none
                      focus:border-[#4880FF]/70
                      focus:ring-4 focus:ring-[#4880FF]/10
                    "
                  />
                  <button
                    type="button"
                    onClick={() => setShow((v) => !v)}
                    className="
                      absolute right-2 top-1/2 -translate-y-1/2
                      rounded-xl px-3 py-2 text-xs text-white/60
                      hover:text-white hover:bg-white/5
                    "
                  >
                    {show ? t("auth.login.hide") : t("auth.login.show")}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="
                  w-full rounded-2xl bg-[#4880FF]
                  py-3.5 text-sm font-medium text-white
                  shadow-lg shadow-[#4880FF]/20
                  hover:brightness-110
                  active:scale-[0.99]
                  transition disabled:opacity-60
                "
              >
                {loading ? t("auth.login.loading") : t("auth.login.submit")}
              </button>

          
            </form>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}

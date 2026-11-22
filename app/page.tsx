import { translator } from "@/lib/i18n/messages";
import { getLocale } from "@/lib/i18n/server";
import de from "@/messages/de/pages/home.json";
import it from "@/messages/it/pages/home.json";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Smartphone, Nfc, QrCode, Users, BarChart2,
  ArrowRight, Check, Zap, Mail, FileText,
  Shield, Megaphone, CalendarDays, Download,
} from "lucide-react";
import { PLANS } from "@/lib/plans";
import { FaqSection } from "./FaqSection";

export default async function LandingPage() {
  const locale = await getLocale();
  const t = translator(locale, de, it);
  const features = [
    { icon: Nfc,          title: t("nfc"),           desc: t("nfcDescription") },
    { icon: QrCode,       title: t("qr"),             desc: t("qrDescription") },
    { icon: Smartphone,   title: t("mobile"),         desc: t("mobileDescription") },
    { icon: Users,        title: t("team"),      desc: t("teamDescription") },
    { icon: BarChart2,    title: t("analytics"),            desc: t("analyticsDescription") },
    { icon: Megaphone,    title: t("campaigns"),   desc: t("campaignsDescription") },
    { icon: Mail,         title: t("signature"),      desc: t("signatureDescription") },
    { icon: CalendarDays, title: t("appointments"),        desc: t("appointmentsDescription") },
    { icon: Download,     title: t("pdf"),   desc: t("pdfDescription") },
    { icon: FileText,     title: t("leadCapture"),         desc: t("leadDescription") },
    { icon: Shield,       title: t("privacyFeature"),  desc: t("privacyDescription") },
    { icon: Zap,          title: t("whiteLabel"),           desc: t("whiteLabelDescription") },
  ];

  const steps = [
    { n: 1, title: t("createAccount"),       desc: t("createAccountDescription") },
    { n: 2, title: t("designCard"),         desc: t("designCardDescription") },
    { n: 3, title: t("shareCard"),      desc: t("shareCardDescription") },
  ];

  const planList = [PLANS.free, PLANS.pro, PLANS.business];

  const PLAN_FEATURES: Record<string, string[]> = {
    free:     [t("freeCard"), t("downloads"), t("leadCapture"), t("fourTemplates"), t("linksLimit", { count: PLANS.free.features.maxCustomLinks }), t("retention", { days: PLANS.free.features.analyticsRetention })],
    pro:      [t("nineTemplates"), t("noBadge"), t("ownDomain"), t("printExport"), t("campaigns"), t("bookingLink"), t("milestoneNotifications"), t("retention", { days: PLANS.pro.features.analyticsRetention })],
    business: [t("allPro"), t("departments"), t("importCsv"), t("organizationTemplate"), t("directory"), t("retention", { days: PLANS.business.features.analyticsRetention })],
  };

  return (
    <div className="min-h-screen bg-background text-gray-900 dark:text-gray-100">

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900">
                <span className="text-xs font-bold text-white">CN</span>
              </div>
              <span className="font-semibold">CardNexus</span>
            </div>
            <div className="hidden md:flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
              <a href="#features" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">{t("features")}</a>
              <a href="#how"      className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">{t("howItWorks")}</a>
              <a href="#pricing"  className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">{t("pricing")}</a>
              <a href="#faq"      className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">FAQ</a>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/login" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors hidden sm:block">
                {t("login")}
              </Link>
              <Button asChild size="sm">
                <Link href="/register">{t("start")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 px-4 py-1.5 text-sm text-gray-600 dark:text-gray-400 mb-8">
          <Zap className="h-3.5 w-3.5 text-amber-500" />
          {t("heroEyebrow")}
        </div>
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-tight mb-6">
          {t("heroTitle")}
          <br />
          <span className="text-gray-400">{t("heroSubtitle")}</span>
        </h1>
        <p className="mx-auto max-w-2xl text-xl text-gray-500 dark:text-gray-400 mb-10 leading-relaxed">
          {t("heroDescription")}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/register">
              {t("startNow")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/c/demo">{t("demo")}</Link>
          </Button>
        </div>

        {/* Mock card */}
        <div className="mt-20 relative max-w-sm mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="h-1.5 bg-gray-900" />
            <div className="p-8">
              <div className="flex items-start gap-4 mb-5">
                <div className="h-16 w-16 rounded-full bg-gray-900 flex items-center justify-center text-white font-bold text-lg shrink-0">MH</div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Max Hoffmann</h3>
                  <p className="text-sm font-medium text-gray-500">Head of Product</p>
                  <p className="text-sm text-gray-400">TechCorp GmbH</p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                {["+49 170 1234567", "max@techcorp.de", "techcorp.de"].map((v) => (
                  <div key={v} className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-gray-400" />
                    </div>
                    {v}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent" />
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────── */}
      <section id="how" className="bg-gray-50 dark:bg-gray-950 py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">{t("howItWorks")}</h2>
            <p className="text-gray-500 dark:text-gray-400">{t("stepsTitle")}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map(({ n, title, desc }) => (
              <div key={n} className="text-center">
                <div className="h-12 w-12 rounded-full bg-gray-900 text-white flex items-center justify-center text-lg font-bold mx-auto mb-4">{n}</div>
                <h3 className="font-semibold text-lg mb-2">{title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section id="features" className="py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">{t("featuresTitle")}</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">{t("featuresDescription")}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow">
                <div className="h-10 w-10 rounded-xl bg-gray-900 flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold mb-1">{title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────────────── */}
      <section id="pricing" className="bg-gray-50 dark:bg-gray-950 py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">{t("pricingTitle")}</h2>
            <p className="text-gray-500 dark:text-gray-400">{t("pricingDescription")}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {planList.map((plan) => {
              const featured = plan.id === "pro";
              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl p-8 border-2 flex flex-col ${
                    featured ? "border-gray-900 bg-gray-900 text-white" : "border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900"
                  }`}
                >
                  {featured && (
                    <span className="text-xs font-semibold bg-white/20 text-white px-2.5 py-1 rounded-full self-start mb-3">
                      {t("recommended")}
                    </span>
                  )}
                  <p className={`text-sm font-medium mb-1 ${featured ? "opacity-60" : "text-gray-500"}`}>{t(`${plan.id}DescriptionPlan`)}</p>
                  <h3 className="text-2xl font-bold mb-1">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-bold">{locale === "de" ? "€" + plan.monthlyPrice : plan.monthlyPrice.toLocaleString(locale, { style: "currency", currency: "EUR", minimumFractionDigits: 0 })}</span>
                    <span className={`text-sm ${featured ? "opacity-60" : "text-gray-400"}`}>{t("monthly")}</span>
                  </div>
                  <ul className="space-y-2.5 mb-8 flex-1">
                    {(PLAN_FEATURES[plan.id] ?? []).map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className={`h-4 w-4 shrink-0 mt-0.5 ${featured ? "text-white" : "text-emerald-500"}`} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button asChild variant={featured ? "secondary" : "default"} className="w-full">
                    <Link href="/register">{plan.id === "free" ? t("start") : t("tryPlan", { plan: plan.name })}</Link>
                  </Button>
                </div>
              );
            })}
          </div>
          <p className="text-center text-sm text-gray-400 dark:text-gray-500 mt-8">
            {t("dataStorage")}
          </p>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">{t("faqTitle")}</h2>
          </div>
          <FaqSection />
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section className="bg-gray-900 py-20 text-center text-white">
        <div className="mx-auto max-w-2xl px-4">
          <h2 className="text-3xl font-bold mb-4">{t("ready")}</h2>
          <p className="text-gray-400 mb-8">{t("freeDescription")}</p>
          <Button asChild size="lg" variant="secondary">
            <Link href="/register">
              {t("register")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 dark:border-gray-800 py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-3 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded bg-gray-900">
                  <span className="text-[10px] font-bold text-white">CN</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-gray-100">CardNexus</span>
              </div>
              <p className="text-sm text-gray-400 dark:text-gray-500 leading-relaxed">
                {t("footerDescription")}
              </p>
            </div>
            <div>
              <p className="font-semibold text-sm mb-3 text-gray-700 dark:text-gray-300">{t("product")}</p>
              <ul className="space-y-2 text-sm text-gray-400 dark:text-gray-500">
                <li><a href="#features"  className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">{t("features")}</a></li>
                <li><a href="#pricing"   className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">{t("pricing")}</a></li>
                <li><Link href="/c/demo" className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">Demo</Link></li>
                <li><Link href="/login"  className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">{t("login")}</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-sm mb-3 text-gray-700 dark:text-gray-300">{t("legal")}</p>
              <ul className="space-y-2 text-sm text-gray-400 dark:text-gray-500">
                <li><Link href="/impressum"  className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">{t("imprint")}</Link></li>
                <li><Link href="/datenschutz" className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">{t("privacy")}</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-100 dark:border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-400 dark:text-gray-500">
            <p>&copy; {new Date().getFullYear()} {t("copyright")}</p>
            <p>{t("madeIn")}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

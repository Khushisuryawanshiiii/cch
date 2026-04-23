import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, LayoutGroup, motion } from "framer-motion"
import {
  Activity,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  Moon,
  Package,
  ShieldCheck,
  Sparkles,
  Sun,
  TrendingUp,
  Upload,
  User,
  UserCog,
  Zap,
} from "lucide-react"
import { OrderGovernanceModule } from "@/modules/order-governance/OrderGovernanceModule"
import { getOgRole } from "@/modules/order-governance/helpers"
import { cn } from "@/lib/utils"
import smallSidebarLogo from "./BBOX. short.png"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5056"

function hasModuleAccess(permissions, moduleName) {
  return permissions.some((permission) => permission.startsWith(`${moduleName}.`))
}

function Sparkline({ data, color = "#6aa6ff", fillFrom = "rgba(106,166,255,0.28)", fillTo = "rgba(106,166,255,0)", height = 36 }) {
  const width = 120
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const step = width / (data.length - 1)
  const points = data.map((v, i) => [i * step, height - ((v - min) / range) * (height - 4) - 2])
  const line = points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ")
  const area = `0,${height} ${line} ${width},${height}`
  const id = `spark-${Math.round(data.reduce((a, b) => a + b, 0))}-${color.replace(/[^a-z0-9]/gi, "")}`
  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="h-9 w-full">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fillFrom} />
          <stop offset="100%" stopColor={fillTo} />
        </linearGradient>
      </defs>
      <polyline points={area} fill={`url(#${id})`} stroke="none" />
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function StatusPill({ tone = "info", children }) {
  const toneClass =
    {
      success: "status-pill-success",
      warning: "status-pill-warning",
      info: "status-pill-info",
      lavender: "status-pill-lavender",
      coral: "status-pill-coral",
    }[tone] || "status-pill-info"
  return <span className={`status-pill ${toneClass}`}>{children}</span>
}

function PriorityDot({ tone = "info" }) {
  const map = {
    high: "bg-rose-400 shadow-[0_0_0_3px_rgba(251,113,133,0.18)]",
    medium: "bg-amber-400 shadow-[0_0_0_3px_rgba(251,191,36,0.18)]",
    info: "bg-blue-400 shadow-[0_0_0_3px_rgba(96,165,250,0.18)]",
    success: "bg-emerald-400 shadow-[0_0_0_3px_rgba(52,211,153,0.18)]",
  }
  return <span className={`mt-1.5 inline-block size-2 rounded-full ${map[tone] || map.info}`} />
}

function AppLogo({ className, src = "/logo.png" }) {
  return (
    <div className={cn("flex shrink-0 items-center justify-center overflow-hidden", className)}>
      <img
        src={src}
        alt="Commercial Hub Logo"
        className="h-full w-auto object-contain"
        onError={(e) => {
          e.target.style.display = 'none';
        }}
      />
    </div>
  )
}

function FloatingField({ id, label, type = "text", value, onChange, required }) {
  return (
    <div className="float-label">
      <Input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder=" "
        required={required}
        className="focus-glow rounded-xl"
      />
      <label htmlFor={id}>{label}</label>
    </div>
  )
}

/** Leaf items only; “Modules” is an accordion group rendered separately. */
const SIDEBAR_LEAF_TABS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "profile", label: "Profile", icon: User },
  { key: "settings", label: "Settings", icon: UserCog },
]

/** Optional sub-navigation rendered as a dropdown beneath a module entry.
 *  When a sub-item is selected we pass its key to the module so it can
 *  render a focused view instead of the default overview. */
const MODULE_SUBITEMS = {
  "order-governance": [
    { key: "deal-explorer", label: "Deal Explorer", icon: LayoutDashboard, roles: ["sales", "reviewer"] },
    { key: "upload-data",   label: "Upload Data",   icon: Upload,          roles: ["reviewer"] },
    { key: "track-approvals", label: "Track Approvals", icon: Activity,    roles: ["sales"] },
    { key: "my-tasks",     label: "My Tasks",       icon: ListChecks,      roles: ["reviewer"] },
  ],
}

const KPIS = [
  {
    key: "pipeline",
    label: "Pipeline Value",
    value: "₹18.4 Cr",
    delta: "+8.2%",
    tone: "success",
    color: "#6aa6ff",
    fillFrom: "rgba(106,166,255,0.28)",
    data: [12, 14, 13, 16, 15, 17, 18, 17, 19, 21, 20, 22],
  },
  {
    key: "pending",
    label: "Pending Reviews",
    value: "21",
    delta: "-3",
    tone: "warning",
    color: "#f5b55a",
    fillFrom: "rgba(245,181,90,0.28)",
    data: [28, 30, 27, 26, 25, 23, 22, 24, 22, 21, 22, 21],
  },
  {
    key: "completed",
    label: "Completed Deals",
    value: "54",
    delta: "+11",
    tone: "success",
    color: "#6ed1b8",
    fillFrom: "rgba(110,209,184,0.28)",
    data: [18, 22, 25, 27, 30, 34, 36, 40, 44, 48, 51, 54],
  },
  {
    key: "cycle",
    label: "Avg Approval Cycle",
    value: "2.4d",
    delta: "-0.6d",
    tone: "lavender",
    color: "#a58cff",
    fillFrom: "rgba(165,140,255,0.28)",
    data: [4, 3.8, 3.6, 3.4, 3.2, 3.1, 3.0, 2.8, 2.7, 2.6, 2.5, 2.4],
  },
]

function App() {
  const [theme, setTheme] = useState("light")
  const [commandOpen, setCommandOpen] = useState(false)
  const [email, setEmail] = useState("admin@commercialcontrolhub.local")
  const [password, setPassword] = useState("Admin@123")
  const [authMode, setAuthMode] = useState("login")
  const [token, setToken] = useState("")
  const [profile, setProfile] = useState(null)
  const [activeModule, setActiveModule] = useState("")
  const [activeShellTab, setActiveShellTab] = useState("dashboard")
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [expandedSidebarModules, setExpandedSidebarModules] = useState(() => new Set())
  const [moduleSubView, setModuleSubView] = useState(null)
  // Bumping `key` forces ReviewerView to re-sync its internal tab/filter even
  // if the same destination is requested twice in a row.
  const [myTasksNav, setMyTasksNav] = useState({ key: 0, tab: "triage", trackingFilter: "all" })
  const modulesDefaultLoadAttemptedRef = useRef(false)

  function toggleSidebarModuleExpanded(moduleKey) {
    setExpandedSidebarModules((prev) => {
      const next = new Set(prev)
      if (next.has(moduleKey)) next.delete(moduleKey)
      else next.add(moduleKey)
      return next
    })
  }

  function goToOrderGovernanceMyTasks({ tab = "triage", trackingFilter = "all" } = {}) {
    setActiveShellTab("modules")
    setModuleSubView("my-tasks")
    setExpandedSidebarModules((prev) => {
      const next = new Set(prev)
      next.add("order-governance")
      return next
    })
    setMyTasksNav((prev) => ({ key: prev.key + 1, tab, trackingFilter }))
    void checkModule("order-governance")
  }

  const moduleCards = useMemo(() => {
    if (!profile) return []
    return [
      {
        key: "order-governance",
        title: "Order Governance",
        icon: ShieldCheck,
        tone: "from-emerald-400/20 via-blue-400/15 to-violet-400/15",
        description: "Reviewer routing, SME approvals, and CC final execution.",
      },
      {
        key: "sales-process",
        title: "Sales Process",
        icon: BriefcaseBusiness,
        tone: "from-blue-400/20 via-violet-400/15 to-emerald-400/15",
        description: "Deal creation, L1/L2 approvals, and stage transitions.",
      },
    ].filter((module) => hasModuleAccess(profile.permissions, module.key))
  }, [profile])

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
  }, [theme])



  /** When opening Modules with no selection, load Order Governance by default (then Sales Process if OG unavailable). */
  useEffect(() => {
    if (activeShellTab !== "modules") {
      modulesDefaultLoadAttemptedRef.current = false
      return
    }
    if (!token || !profile) return
    if (activeModule) return
    if (moduleCards.length === 0) return
    if (modulesDefaultLoadAttemptedRef.current) return
    modulesDefaultLoadAttemptedRef.current = true
    if (hasModuleAccess(profile.permissions, "order-governance")) {
      void checkModule("order-governance")
    } else if (hasModuleAccess(profile.permissions, "sales-process")) {
      void checkModule("sales-process")
    }
  }, [activeShellTab, token, profile, activeModule, moduleCards.length])

  useEffect(() => {
    function onKeyDown(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setCommandOpen((open) => !open)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  async function handleLogin(event) {
    event.preventDefault()
    setIsLoading(true)
    setMessage("")
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      if (!response.ok) {
        const error = await response.text()
        throw new Error(error || "Login failed")
      }
      const data = await response.json()
      setToken(data.accessToken)
      setProfile({
        userId: data.userId,
        email: data.email,
        displayName: data.displayName,
        roles: data.roles,
        permissions: data.permissions,
      })
      setMessage("Login successful.")
    } catch (error) {
      setMessage(error.message || "Unable to login.")
    } finally {
      setIsLoading(false)
    }
  }

  async function checkModule(moduleName) {
    if (!token) return
    setMessage("")
    try {
      const endpoint = moduleName === "sales-process" ? "sales-process" : "order-governance"
      const response = await fetch(`${API_BASE_URL}/api/${endpoint}/ping`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) {
        const error = await response.text()
        throw new Error(error || "Access failed")
      }
      setActiveModule(moduleName)
      setMessage(`${moduleName} starter endpoint is reachable. Module development can begin.`)
    } catch (error) {
      setMessage(error.message || "Module access failed.")
    }
  }

  function handleLogout() {
    setToken("")
    setProfile(null)
    setActiveModule("")
    setActiveShellTab("dashboard")
    setModuleSubView(null)
    setExpandedSidebarModules(new Set())
    setMyTasksNav({ key: 0, tab: "triage", trackingFilter: "all" })
    modulesDefaultLoadAttemptedRef.current = false
    setAuthMode("login")
    setMessage("Logged out.")
  }

  function renderAuthContent() {
    return (
      <Card className="login-glass-card flex h-[470.9px] w-[min(440px,calc(100vw-2rem))] shrink-0 flex-col gap-0 overflow-hidden rounded-2xl border border-white/70 py-0 shadow-[0_2px_0_0_rgba(255,255,255,0.55)_inset,0_40px_100px_-20px_rgba(15,77,99,0.45),0_18px_40px_-12px_rgba(30,64,175,0.28)] ring-1 ring-slate-900/[0.06] backdrop-blur-2xl dark:border-white/14 dark:shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset,0_40px_100px_-16px_rgba(0,0,0,0.65),0_24px_48px_-20px_rgba(15,118,110,0.35)] dark:ring-white/[0.08]">
        <CardHeader className="shrink-0 space-y-4 px-8 pb-2 pt-8 text-center sm:px-9">
          <div className="flex justify-center">
            <AppLogo className="h-8 w-auto" />
          </div>
          <h1 className="login-app-title-gradient font-app-display text-[clamp(1.125rem,4.2vw,1.5rem)] font-bold leading-tight tracking-[0.02em]">
            Commercial Control Hub
          </h1>
          {authMode === "login" ? (
            <>
              <CardTitle className="text-lg font-semibold tracking-tight text-black dark:text-white">Sign in</CardTitle>
              <CardDescription className="text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem]">
                Enter your work email and password.
              </CardDescription>
            </>
          ) : (
            <>
              <CardTitle className="text-lg font-semibold tracking-tight text-black dark:text-white">Forgot password</CardTitle>
              <CardDescription className="text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem]">
                Enter your work email and we will send a reset link if the account exists.
              </CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-8 pb-6 pt-0 sm:px-9 sm:pb-7">
          <AnimatePresence mode="wait">
            {authMode === "login" && (
              <motion.form
                key="login"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                onSubmit={handleLogin}
                className="space-y-4"
              >
                <FloatingField id="login-email" label="Work email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <FloatingField id="login-password" label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="submit" disabled={isLoading} className="btn-gradient mt-1 h-11 w-full rounded-xl text-base font-semibold disabled:opacity-60">
                  {isLoading ? "Signing in..." : "Sign in"}
                </button>
                <p className="pt-1 text-center text-sm text-muted-foreground">
                  <button type="button" onClick={() => setAuthMode("forgot")} className="underline-offset-4 hover:text-foreground hover:underline">
                    Forgot password?
                  </button>
                </p>
              </motion.form>
            )}
            {authMode === "forgot" && (
              <motion.div
                key="forgot"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                <FloatingField id="fp-email" label="Work email" type="email" />
                <button type="button" className="btn-gradient mt-1 h-11 w-full rounded-xl text-base font-semibold">Send reset link</button>
                <button type="button" onClick={() => setAuthMode("login")} className="block w-full pt-1 text-center text-sm text-muted-foreground hover:text-foreground">
                  Back to sign in
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    )
  }

  function ThemeToggle({ size = "icon-sm" }) {
    return (
      <Button variant="outline" size={size} onClick={() => setTheme((prev) => (prev === "light" ? "dark" : "light"))}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={theme}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="inline-flex"
          >
            {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
          </motion.span>
        </AnimatePresence>
      </Button>
    )
  }

  function SidebarRail({ onNavigate }) {
    const dashboardTab = SIDEBAR_LEAF_TABS[0]
    const restLeafTabs = SIDEBAR_LEAF_TABS.slice(1)
    const DashboardIcon = dashboardTab.icon

    return (
      <LayoutGroup id="sidebar-rail">
        <nav className="flex flex-col gap-1">
          <button
            key={dashboardTab.key}
            type="button"
            data-active={activeShellTab === dashboardTab.key}
            onClick={() => {
              setActiveShellTab(dashboardTab.key)
              onNavigate?.()
            }}
            className={cn("sidebar-item", !sidebarOpen && "justify-center px-2")}
            title={dashboardTab.label}
          >
            <DashboardIcon className="size-4 shrink-0" />
            {sidebarOpen && <span className="flex-1 text-left">{dashboardTab.label}</span>}
            {activeShellTab === dashboardTab.key && (
              <motion.span layoutId="sidebar-caret" className="text-foreground/70">
                <ChevronRight className="size-3.5" />
              </motion.span>
            )}
          </button>

          {moduleCards.map((module) => {
            const Icon = module.icon
            const currentRole = profile ? getOgRole(profile.roles) : "sales"
            const subItems = (MODULE_SUBITEMS[module.key] || []).filter((sub) =>
              !sub.roles || sub.roles.includes(currentRole)
            )
            const hasSubItems = sidebarOpen && subItems.length > 0
            const isExpanded = expandedSidebarModules.has(module.key)
            const isModuleActive = activeShellTab === "modules" && activeModule === module.key
            const isParentActive = isModuleActive && !moduleSubView
            return (
              <div key={module.key} className="flex flex-col">
                <button
                  type="button"
                  data-active={isParentActive}
                  onClick={() => {
                    setActiveShellTab("modules")
                    setModuleSubView(null)
                    if (hasSubItems) {
                      setExpandedSidebarModules((prev) => {
                        const next = new Set(prev)
                        next.add(module.key)
                        return next
                      })
                    }
                    void checkModule(module.key)
                    onNavigate?.()
                  }}
                  className={cn("sidebar-item", !sidebarOpen && "justify-center px-2")}
                  title={module.title}
                >
                  <Icon className="size-4 shrink-0" />
                  {sidebarOpen && <span className="flex-1 text-left">{module.title}</span>}
                  {hasSubItems ? (
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label={isExpanded ? `Collapse ${module.title}` : `Expand ${module.title}`}
                      onClick={(event) => {
                        event.stopPropagation()
                        toggleSidebarModuleExpanded(module.key)
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault()
                          event.stopPropagation()
                          toggleSidebarModuleExpanded(module.key)
                        }
                      }}
                      className="inline-flex size-5 items-center justify-center rounded-md text-foreground/60 transition-colors hover:bg-white/60 hover:text-foreground/90 dark:hover:bg-slate-800/60"
                    >
                      <ChevronDown
                        className={cn(
                          "size-3.5 transition-transform duration-200",
                          isExpanded ? "rotate-0" : "-rotate-90",
                        )}
                      />
                    </span>
                  ) : (
                    isParentActive && (
                      <motion.span layoutId="sidebar-caret" className="text-foreground/70">
                        <ChevronRight className="size-3.5" />
                      </motion.span>
                    )
                  )}
                </button>

                {hasSubItems && isExpanded && (
                  <div className="ml-4 mt-1 flex flex-col gap-1 border-l border-white/60 pl-3 dark:border-white/10">
                    {subItems.map((sub) => {
                      const SubIcon = sub.icon
                      const isSubActive = isModuleActive && moduleSubView === sub.key
                      return (
                        <button
                          key={sub.key}
                          type="button"
                          data-active={isSubActive}
                          onClick={() => {
                            setActiveShellTab("modules")
                            setModuleSubView(sub.key)
                            void checkModule(module.key)
                            onNavigate?.()
                          }}
                          className={cn("sidebar-item", !sidebarOpen && "justify-center px-2")}
                          title={sub.label}
                        >
                          {SubIcon && <SubIcon className="size-3.5 shrink-0" />}
                          {sidebarOpen && <span className="flex-1 text-left text-[13px]">{sub.label}</span>}
                          {isSubActive && (
                            <motion.span layoutId="sidebar-caret" className="text-foreground/70">
                              <ChevronRight className="size-3.5" />
                            </motion.span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}

          {restLeafTabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeShellTab === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                data-active={isActive}
                onClick={() => {
                  setActiveShellTab(tab.key)
                  onNavigate?.()
                }}
                className={cn("sidebar-item", !sidebarOpen && "justify-center px-2")}
                title={tab.label}
              >
                <Icon className="size-4 shrink-0" />
                {sidebarOpen && <span className="flex-1 text-left">{tab.label}</span>}
                {isActive && (
                  <motion.span layoutId="sidebar-caret" className="text-foreground/70">
                    <ChevronRight className="size-3.5" />
                  </motion.span>
                )}
              </button>
            )
          })}
        </nav>
      </LayoutGroup>
    )
  }

  return (
    <main className="relative min-h-screen">
      {!profile ? (
        <>
          <div className="login-gradient-bg pointer-events-none fixed inset-0 -z-10" aria-hidden />
          <div className="pointer-events-none fixed inset-0 -z-[9] bg-white/10 dark:bg-slate-950/35" aria-hidden />
          <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
            <div className="rounded-xl border border-white/40 bg-white/45 p-0.5 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-slate-950/50">
              <ThemeToggle size="icon-sm" />
            </div>
          </div>
          <div className="mx-auto flex min-h-screen w-full max-w-[min(100%,42rem)] flex-col items-center justify-center px-4 py-12 sm:px-6 sm:py-14">
            {renderAuthContent()}
            <AnimatePresence>
              {message && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="mt-6 rounded-2xl border border-emerald-300/50 bg-emerald-50/95 px-5 py-4 text-sm text-emerald-900 shadow-lg backdrop-blur-md dark:border-emerald-800/50 dark:bg-emerald-950/70 dark:text-emerald-200"
                >
                  {message}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      ) : (
        <div className="relative h-screen overflow-hidden px-4 py-4 sm:px-6">
          <div className="mx-auto flex h-full max-w-7xl flex-col gap-5 lg:flex-row">
            <aside
              className={cn(
                "hidden overflow-hidden transition-[width,opacity] duration-300 ease-out lg:block",
                sidebarOpen ? "w-[248px] opacity-100" : "w-[76px] opacity-100",
              )}
              aria-hidden={!sidebarOpen}
            >
              <Card className="glass-card h-full border-white/40 dark:border-white/10">
                <CardHeader className="pb-4 pt-5 px-5">
                  <div className={cn("flex flex-col gap-3.5", sidebarOpen ? "items-start" : "items-center")}>
                    <AppLogo className="h-6 w-auto" src={sidebarOpen ? "/logo.png" : smallSidebarLogo} />
                    <div className={cn("space-y-0.5", !sidebarOpen && "text-center")}>
                      <CardTitle className={cn("text-[15px] font-semibold tracking-tight text-slate-900 dark:text-white leading-tight", !sidebarOpen && "text-[12px] font-extrabold")}>
                        {sidebarOpen ? "Commercial Control Hub" : "CCH"}
                      </CardTitle>
                      {sidebarOpen && (
                        <CardDescription className="text-[12px] font-medium text-slate-500">
                          {profile.displayName}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <SidebarRail />
                  {sidebarOpen && (
                    <>
                      <Separator className="my-3" />
                      <div className="rounded-2xl border border-white/50 bg-gradient-to-br from-blue-50/70 via-violet-50/50 to-emerald-50/60 p-3 text-xs dark:border-white/10 dark:from-blue-950/30 dark:via-violet-950/20 dark:to-emerald-950/25">
                        <p className="font-semibold">Tip</p>
                        <p className="mt-0.5 text-muted-foreground">Press <kbd className="rounded bg-white/80 px-1 text-[10px] font-semibold dark:bg-slate-800/70">⌘ K</kbd> to open commands.</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </aside>

            <section className="min-w-0 flex-1 overflow-y-auto space-y-5 pr-1 transition-all duration-300 ease-out">
              <header className="sticky top-0 z-30 flex items-center justify-between gap-3 rounded-2xl border border-white/40 bg-white/85 px-3 py-2 shadow-[0_10px_30px_-15px_rgba(30,60,120,0.25)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    className="hidden lg:inline-flex"
                    onClick={() => setSidebarOpen((open) => !open)}
                    aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                    title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                  >
                    <Menu className="size-4" />
                  </Button>
                  <Sheet>
                    <SheetTrigger render={<Button variant="outline" size="icon-sm" className="lg:hidden"><Menu className="size-4" /></Button>} />
                    <SheetContent side="left" className="glass-panel">
                      <SheetHeader>
                        <SheetTitle>Navigation</SheetTitle>
                      </SheetHeader>
                      <div className="p-3">
                        <SidebarRail />
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
                <div className="flex items-center gap-2">
                  <ThemeToggle />
                  <Button variant="outline" size="icon-sm" className="relative">
                    <Bell className="size-4" />
                    <span className="pulse-dot absolute top-1 right-1" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button variant="ghost" size="sm" className="gap-2 rounded-xl">
                          <Avatar className="size-7 ring-1 ring-white/60 dark:ring-white/10">
                            <AvatarFallback className="bg-gradient-to-br from-blue-400 to-violet-400 text-white">{profile.displayName?.slice(0, 1)}</AvatarFallback>
                          </Avatar>
                          <span className="hidden text-xs font-medium sm:inline">{profile.displayName}</span>
                        </Button>
                      }
                    />
                    <DropdownMenuContent sideOffset={8}>
                      <DropdownMenuItem onClick={() => setActiveShellTab("profile")}><User className="size-4" /> Profile</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSettingsOpen(true)}><UserCog className="size-4" /> Settings</DropdownMenuItem>
                      <DropdownMenuItem onClick={handleLogout}><LogOut className="size-4" /> Logout</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </header>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeShellTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-5"
                >
                  {activeShellTab === "dashboard" && (
                    <>
                      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {KPIS.map((kpi, idx) => (
                          <motion.div
                            key={kpi.key}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25, delay: idx * 0.04 }}
                          >
                            <Card className="glass-card glass-card-hover gradient-border border-white/40 dark:border-white/10">
                              <CardContent className="pt-4">
                                <div className="flex items-start justify-between">
                                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                                  <StatusPill tone={kpi.tone}>
                                    <TrendingUp className="size-3" /> {kpi.delta}
                                  </StatusPill>
                                </div>
                                <p className="mt-1 text-2xl font-semibold tracking-tight">{kpi.value}</p>
                                <div className="-mx-1 mt-2">
                                  <Sparkline data={kpi.data} color={kpi.color} fillFrom={kpi.fillFrom} />
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>

                      <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
                        <Card className="glass-card border-white/40 dark:border-white/10">
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="text-base">Pipeline Momentum</CardTitle>
                                <CardDescription>Rolling 12-week deal flow across modules.</CardDescription>
                              </div>
                              <StatusPill tone="info"><Activity className="size-3" /> Live</StatusPill>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="h-36 rounded-xl bg-gradient-to-br from-blue-50/70 via-violet-50/60 to-emerald-50/70 p-3 ring-1 ring-white/60 dark:from-blue-950/30 dark:via-violet-950/25 dark:to-emerald-950/30 dark:ring-white/10">
                              <Sparkline
                                data={[12, 14, 13, 16, 15, 17, 18, 17, 19, 21, 20, 22, 23, 22, 24]}
                                color="#6aa6ff"
                                fillFrom="rgba(106,166,255,0.35)"
                                height={120}
                              />
                            </div>
                            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                              <div className="rounded-xl border bg-background/60 p-2">
                                <p className="text-muted-foreground">New</p>
                                <p className="text-sm font-semibold">32</p>
                              </div>
                              <div className="rounded-xl border bg-background/60 p-2">
                                <p className="text-muted-foreground">Routed</p>
                                <p className="text-sm font-semibold">48</p>
                              </div>
                              <div className="rounded-xl border bg-background/60 p-2">
                                <p className="text-muted-foreground">Approved</p>
                                <p className="text-sm font-semibold">66</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="glass-card border-white/40 dark:border-white/10">
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base">Recent Notifications</CardTitle>
                              <Button variant="ghost" size="xs" className="text-xs">View all</Button>
                            </div>
                            <CardDescription>Priority-coded updates across your workspace.</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-1">
                            {[
                              { tone: "high", title: "CC Manager pending confirmation for 2 records", time: "2m ago" },
                              { tone: "medium", title: "Reviewer route updated for OP-2101", time: "18m ago" },
                              { tone: "info", title: "Central manager approved 3 deals", time: "1h ago" },
                              { tone: "success", title: "Sales completed ingestion for batch #48", time: "3h ago" },
                            ].map((item) => (
                              <div key={item.title} className="flex items-start gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-white/50 dark:hover:bg-slate-800/40">
                                <PriorityDot tone={item.tone} />
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm">{item.title}</p>
                                  <p className="text-[11px] text-muted-foreground">{item.time}</p>
                                </div>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      </div>
                    </>
                  )}

                  {activeShellTab === "modules" && (
                    <>
                      {moduleCards.length === 0 && (
                        <Card className="glass-card border-white/40 dark:border-white/10">
                          <CardContent className="py-10 text-center text-sm text-muted-foreground">
                            No modules are mapped to your role yet. Contact your workspace admin.
                          </CardContent>
                        </Card>
                      )}


                      {activeModule === "order-governance" && (
                        <OrderGovernanceModule
                          token={token}
                          permissions={profile.permissions}
                          roles={profile.roles}
                          apiBaseUrl={API_BASE_URL}
                          subView={moduleSubView}
                          myTasksNav={myTasksNav}
                          onGoToMyTasks={goToOrderGovernanceMyTasks}
                        />
                      )}
                    </>
                  )}

                  {activeShellTab === "analytics" && (
                    <Card className="glass-card border-white/40 dark:border-white/10">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-base">Analytics</CardTitle>
                            <CardDescription>Modern chart-ready section and table views.</CardDescription>
                          </div>
                          <StatusPill tone="lavender">Beta</StatusPill>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-5">
                        <div className="grid gap-3 sm:grid-cols-3">
                          {[
                            { label: "Win Rate", value: 62, tone: "from-blue-400 to-violet-400" },
                            { label: "Review SLA", value: 44, tone: "from-amber-400 to-rose-400" },
                            { label: "CC Confirmed", value: 78, tone: "from-emerald-400 to-blue-400" },
                          ].map((metric, idx) => (
                            <motion.div
                              key={metric.label}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.25, delay: idx * 0.05 }}
                              className="rounded-2xl border border-white/50 bg-white/55 p-3 backdrop-blur dark:border-white/10 dark:bg-slate-900/40"
                            >
                              <div className="flex items-center justify-between">
                                <p className="text-xs text-muted-foreground">{metric.label}</p>
                                <p className="text-xs font-semibold">{metric.value}%</p>
                              </div>
                              <div className="mt-2 h-2 rounded-full bg-muted">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${metric.value}%` }}
                                  transition={{ duration: 0.6, ease: "easeOut" }}
                                  className={`h-2 rounded-full bg-gradient-to-r ${metric.tone}`}
                                />
                              </div>
                            </motion.div>
                          ))}
                        </div>

                        <div className="overflow-hidden rounded-2xl border border-white/50 bg-white/55 backdrop-blur dark:border-white/10 dark:bg-slate-900/40">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Deal</TableHead>
                                <TableHead>Owner</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Value</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {[
                                { id: "OP-2098", owner: "A. Rao", status: "In Approval", tone: "info", value: "₹14,40,000" },
                                { id: "OP-2101", owner: "P. Singh", status: "Pending Review", tone: "warning", value: "₹9,20,000" },
                                { id: "OP-2104", owner: "R. Iyer", status: "Completed", tone: "success", value: "₹22,10,000" },
                                { id: "OP-2109", owner: "M. Khan", status: "Returned", tone: "coral", value: "₹5,60,000" },
                              ].map((row) => (
                                <TableRow key={row.id} className="soft-row">
                                  <TableCell className="font-medium">{row.id}</TableCell>
                                  <TableCell>{row.owner}</TableCell>
                                  <TableCell><StatusPill tone={row.tone}>{row.status}</StatusPill></TableCell>
                                  <TableCell className="text-right tabular-nums">{row.value}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {(activeShellTab === "profile" || activeShellTab === "settings") && (
                    <div className="grid gap-4 xl:grid-cols-2">
                      <Card className="glass-card border-white/40 dark:border-white/10">
                        <CardHeader>
                          <CardTitle className="text-base">Profile</CardTitle>
                          <CardDescription>Your identity across the workspace.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="size-12 ring-1 ring-white/60 dark:ring-white/10">
                              <AvatarFallback className="bg-gradient-to-br from-blue-400 to-violet-400 text-white">
                                {profile.displayName?.slice(0, 1)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold">{profile.displayName}</p>
                              <p className="truncate text-xs text-muted-foreground">{profile.email}</p>
                            </div>
                          </div>
                          <Input value={profile.displayName} readOnly className="rounded-xl" />
                          <Input value={profile.email} readOnly className="rounded-xl" />
                          <div className="flex flex-wrap gap-1.5">
                            {profile.roles.map((role) => (
                              <StatusPill key={role} tone="lavender">{role}</StatusPill>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="glass-card border-white/40 dark:border-white/10">
                        <CardHeader>
                          <CardTitle className="text-base">Settings</CardTitle>
                          <CardDescription>Tune the feel of your workspace.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <button type="button" onClick={() => setTheme((prev) => (prev === "light" ? "dark" : "light"))} className="flex w-full items-center justify-between rounded-xl border bg-background/60 px-3 py-2 text-sm transition-colors hover:bg-muted/60">
                            <span className="inline-flex items-center gap-2">
                              {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
                              Theme
                            </span>
                            <StatusPill tone="info">{theme}</StatusPill>
                          </button>
                          <button type="button" onClick={() => setSettingsOpen(true)} className="flex w-full items-center justify-between rounded-xl border bg-background/60 px-3 py-2 text-sm transition-colors hover:bg-muted/60">
                            <span className="inline-flex items-center gap-2"><UserCog className="size-4" /> Preferences</span>
                            <ChevronRight className="size-4 text-muted-foreground" />
                          </button>
                          <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/60 p-3 text-xs text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
                            <p className="font-semibold">All systems healthy</p>
                            <p className="mt-0.5 opacity-80">API reachable · session valid · theme synced</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
              <AnimatePresence>
                {message && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-2xl border border-emerald-300/40 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-800 shadow-[0_10px_30px_-18px_rgba(16,185,129,0.35)] backdrop-blur dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-300"
                  >
                    {message}
                  </motion.div>
                )}
              </AnimatePresence>

              <footer className="rounded-2xl border border-white/40 bg-white/55 px-4 py-3 text-xs text-muted-foreground backdrop-blur dark:border-white/10 dark:bg-slate-900/50">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="inline-flex size-4 items-center justify-center rounded-md bg-gradient-to-br from-blue-400 via-violet-400 to-emerald-400 text-white">
                      <Sparkles className="size-2.5" />
                    </span>
                    Commercial Control Hub · Modern UI Foundation
                  </span>
                  <span>API: {API_BASE_URL}</span>
                </div>
              </footer>
            </section>
          </div>
        </div>
      )}

      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <CommandInput placeholder="Search actions, modules, settings..." />
        <CommandList>
          <CommandEmpty>No result found.</CommandEmpty>
          <CommandGroup heading="Quick Navigation">
            <CommandItem onSelect={() => { setActiveShellTab("dashboard"); setCommandOpen(false) }}><LayoutDashboard className="size-4" /> Go to dashboard</CommandItem>
            {hasModuleAccess(profile?.permissions ?? [], "order-governance") && (
              <CommandItem onSelect={() => { setActiveShellTab("modules"); setModuleSubView(null); void checkModule("order-governance"); setCommandOpen(false) }}>
                <ShieldCheck className="size-4" /> Open Order Governance
              </CommandItem>
            )}
            {hasModuleAccess(profile?.permissions ?? [], "order-governance") && (
              <CommandItem onSelect={() => { setActiveShellTab("modules"); setModuleSubView("my-tasks"); setExpandedSidebarModules((prev) => { const next = new Set(prev); next.add("order-governance"); return next }); void checkModule("order-governance"); setCommandOpen(false) }}>
                <ListChecks className="size-4" /> Open My Tasks
              </CommandItem>
            )}
            {hasModuleAccess(profile?.permissions ?? [], "sales-process") && (
              <CommandItem onSelect={() => { setActiveShellTab("modules"); setModuleSubView(null); void checkModule("sales-process"); setCommandOpen(false) }}>
                <BriefcaseBusiness className="size-4" /> Open Sales Process
              </CommandItem>
            )}
            <CommandItem onSelect={() => { setActiveShellTab("analytics"); setCommandOpen(false) }}><BarChart3 className="size-4" /> View analytics</CommandItem>
          </CommandGroup>
          <CommandGroup heading="Preferences">
            <CommandItem onSelect={() => { setTheme((prev) => (prev === "light" ? "dark" : "light")); setCommandOpen(false) }}><Moon className="size-4" /> Toggle theme</CommandItem>
            <CommandItem onSelect={() => { setSettingsOpen(true); setCommandOpen(false) }}><UserCog className="size-4" /> Open preferences</CommandItem>
          </CommandGroup>
          {profile && (
            <CommandGroup heading="Session">
              <CommandItem onSelect={() => { handleLogout(); setCommandOpen(false) }}><LogOut className="size-4" /> Logout</CommandItem>
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Workspace Preferences</DialogTitle>
            <DialogDescription>Calm motion, compact density, and pastel accents — ready for module-level extension.</DialogDescription>
          </DialogHeader>
          <Separator />
          <div className="space-y-3">
            <div className="rounded-xl border bg-background/60 p-3"><p className="text-sm font-medium">Theme Mode</p><p className="text-xs text-muted-foreground capitalize">{theme}</p></div>
            <div className="rounded-xl border bg-background/60 p-3"><p className="text-sm font-medium">Density</p><p className="text-xs text-muted-foreground">Comfortable</p></div>
            <div className="rounded-xl border bg-background/60 p-3"><p className="text-sm font-medium">Motion</p><p className="text-xs text-muted-foreground">Subtle micro-interactions enabled</p></div>
          </div>
          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>
    </main>
  )
}

export default App

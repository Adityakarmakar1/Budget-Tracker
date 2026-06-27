import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import Sidebar, { type View } from './components/Sidebar';
import TopBar from './components/TopBar';
import DashboardView from './components/DashboardView';
import BudgetsView from './components/BudgetsView';
import TransactionsView from './components/TransactionsView';
import AddTransactionModal from './components/AddTransactionModal';
import ResetConfirmModal from './components/ResetConfirmModal';
import AuthScreen from './components/AuthScreen';
import SetupScreen from './components/SetupScreen';
import Walkthrough from './components/Walkthrough';
import InstallPrompt from './components/InstallPrompt';
import InsightsModal from './components/InsightsModal';
import { useFinanceStore } from './lib/store';
import {
  budgetStatuses,
  expenseByCategory,
  lastNMonths,
  monthTransactions,
  summarize,
  trend,
} from './lib/analytics';
import { monthLabel } from './lib/format';
import { getCurrentUser, onAuthChange, signOut, type SessionUser } from './lib/auth';
import { isSupabaseConfigured } from './lib/supabase';
import { initCurrency, useCurrency } from './lib/currency';

type Theme = 'dark' | 'light';

const VIEW_META: Record<View, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Your financial overview at a glance' },
  transactions: { title: 'Transactions', subtitle: 'Every income and expense, fully searchable' },
  budgets: { title: 'Budgets', subtitle: 'Set limits and stay on track each month' },
};

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  const saved = window.localStorage.getItem('finflow-theme');
  if (saved === 'light' || saved === 'dark') return saved;
  return 'dark';
}

export default function App() {
  const [supabaseReady, setSupabaseReady] = useState(() => isSupabaseConfigured());
  const [authChecking, setAuthChecking] = useState(true);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [installEvent, setInstallEvent] = useState<any>(null);

  // Capture the beforeinstallprompt event globally so it isn't missed
  // (the event fires at startup, before the InstallPrompt modal mounts).
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Apply + persist theme.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    window.localStorage.setItem('finflow-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  // Check existing session + listen for auth changes.
  useEffect(() => {
    if (!supabaseReady) {
      setAuthChecking(false);
      return;
    }

    let unsub: (() => void) | undefined;

    (async () => {
      try {
        const current = await getCurrentUser();
        setUser(current);
      } catch {
        /* ignore */
      } finally {
        setAuthChecking(false);
      }

      try {
        unsub = onAuthChange((u) => setUser(u));
      } catch {
        /* ignore */
      }
    })();

    return () => {
      unsub?.();
    };
  }, [supabaseReady]);

  const handleLogout = async () => {
    await signOut();
    setUser(null);
  };

  // Initialise currency preference when user changes.
  useEffect(() => {
    if (user) {
      initCurrency(user.id);
    }
  }, [user]);

  // 1. Supabase not configured → setup screen
  if (!supabaseReady) {
    return <SetupScreen onConfigured={() => setSupabaseReady(true)} />;
  }

  // 2. Checking auth session → loading spinner
  if (authChecking) {
    return (
      <div className="min-h-screen grid place-items-center relative">
        <div className="aurora" />
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
          <p className="text-sm text-white/50">Loading your account…</p>
        </div>
      </div>
    );
  }

  // 3. Not logged in → auth screen
  if (!user) {
    return <AuthScreen onAuthed={setUser} />;
  }

  // 4. Logged in → dashboard
  return (
    <Dashboard
      user={user}
      theme={theme}
      onToggleTheme={toggleTheme}
      onLogout={handleLogout}
      installEvent={installEvent}
      onInstallConsumed={() => setInstallEvent(null)}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Dashboard — separated so hooks never run conditionally in App.    */
/* ------------------------------------------------------------------ */

interface DashboardProps {
  user: SessionUser;
  theme: Theme;
  onToggleTheme: () => void;
  onLogout: () => void;
  installEvent: any;
  onInstallConsumed: () => void;
}

function Dashboard({ user, theme, onToggleTheme, onLogout, installEvent, onInstallConsumed }: DashboardProps) {
  const store = useFinanceStore(user.id);
  // Subscribe to currency changes so the entire tree re-renders with new symbols.
  useCurrency();
  const [view, setView] = useState<View>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [walkthroughOpen, setWalkthroughOpen] = useState(false);
  const [installOpen, setInstallOpen] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);

  // Register the service worker for PWA / offline support.
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  // Show the walkthrough once data finishes loading for a first-time user
  // (no transactions yet), or when triggered after a reset.
  useEffect(() => {
    if (!store.loading && store.transactions.length === 0) {
      const seenKey = `finflow-tour-${user.id}`;
      if (!localStorage.getItem(seenKey)) {
        setWalkthroughOpen(true);
      }
    }
  }, [store.loading, store.transactions.length, user.id]);

  const closeWalkthrough = () => {
    localStorage.setItem(`finflow-tour-${user.id}`, 'done');
    setWalkthroughOpen(false);
  };

  const months = useMemo(() => lastNMonths(6), []);
  const trendData = useMemo(() => trend(store.transactions, months), [store.transactions, months]);

  const monthTxns = useMemo(
    () => monthTransactions(store.transactions, store.selectedMonth),
    [store.transactions, store.selectedMonth],
  );

  const summary = useMemo(() => summarize(monthTxns), [monthTxns]);

  const prevSummary = useMemo(() => {
    const idx = months.indexOf(store.selectedMonth);
    if (idx <= 0) return undefined;
    const prev = months[idx - 1];
    return summarize(monthTransactions(store.transactions, prev));
  }, [store.transactions, months, store.selectedMonth]);

  const slices = useMemo(
    () => expenseByCategory(monthTxns, store.customCategories),
    [monthTxns, store.customCategories],
  );
  const totalExpense = useMemo(() => slices.reduce((a, b) => a + b.value, 0), [slices]);
  const statuses = useMemo(
    () => budgetStatuses(store.budgets, monthTxns),
    [store.budgets, monthTxns],
  );

  const shiftMonth = (dir: -1 | 1) => {
    const idx = months.indexOf(store.selectedMonth);
    const next = idx + dir;
    if (next >= 0 && next < months.length) store.setSelectedMonth(months[next]);
  };

  const meta = VIEW_META[view];
  const subtitle =
    view === 'dashboard'
      ? `${monthLabel(store.selectedMonth)} · ${meta.subtitle}`
      : view === 'budgets'
        ? `${monthLabel(store.selectedMonth)} · ${meta.subtitle}`
        : meta.subtitle;

  if (store.loading) {
    return (
      <div className="min-h-screen grid place-items-center relative">
        <div className="aurora" />
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
          <p className="text-sm text-white/50">Loading your financial data…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <div className="aurora" />

      <Sidebar
        view={view}
        onChange={setView}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onReset={() => setResetOpen(true)}
        theme={theme}
        onToggleTheme={onToggleTheme}
        user={user}
        onLogout={onLogout}
        onInstall={() => setInstallOpen(true)}
        isInstalled={
          typeof window !== 'undefined' &&
          (window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true)
        }
        onInsights={() => setInsightsOpen(true)}
      />

      <div className="lg:pl-72">
        <TopBar
          title={meta.title}
          subtitle={subtitle}
          selectedMonth={store.selectedMonth}
          onPrevMonth={() => shiftMonth(-1)}
          onNextMonth={() => shiftMonth(1)}
          onMenu={() => setSidebarOpen(true)}
          onAdd={() => setModalOpen(true)}
        />

        <main className="px-4 sm:px-6 lg:px-8 pb-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              {view === 'dashboard' && (
                <DashboardView
                  summary={summary}
                  prevSummary={prevSummary}
                  trend={trendData}
                  slices={slices}
                  totalExpense={totalExpense}
                  statuses={statuses}
                  monthTxns={monthTxns}
                />
              )}
              {view === 'transactions' && (
                <TransactionsView
                  transactions={store.transactions}
                  onDelete={store.deleteTransaction}
                  customCategories={store.customCategories}
                  selectedMonth={store.selectedMonth}
                />
              )}
              {view === 'budgets' && (
                <BudgetsView
                  statuses={statuses}
                  onSave={store.updateBudget}
                  onResetBudgets={store.resetBudgets}
                  selectedMonth={store.selectedMonth}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <AddTransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={store.addTransaction}
        customCategories={store.customCategories}
        onAddCategory={store.addCategory}
      />

      <ResetConfirmModal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={() => {
          store.resetAll();
          // Clear the "seen" flag so the walkthrough shows again after reset.
          localStorage.removeItem(`finflow-tour-${user.id}`);
          setWalkthroughOpen(true);
        }}
      />

      <Walkthrough
        open={walkthroughOpen}
        onClose={closeWalkthrough}
        theme={theme}
      />

      <InstallPrompt
        open={installOpen}
        onClose={() => setInstallOpen(false)}
        deferredPrompt={installEvent}
        onInstalled={onInstallConsumed}
      />

      <InsightsModal
        open={insightsOpen}
        onClose={() => setInsightsOpen(false)}
        summary={summary}
        prevSummary={prevSummary}
        trend={trendData}
        slices={slices}
        statuses={statuses}
        transactions={monthTxns}
        selectedMonth={store.selectedMonth}
      />
    </div>
  );
}

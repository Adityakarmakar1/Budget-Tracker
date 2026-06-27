import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Monitor, Check, Loader2 } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface Props {
  open: boolean;
  onClose: () => void;
  deferredPrompt: BeforeInstallPromptEvent | null;
  onInstalled: () => void;
}

export default function InstallPrompt({ open, onClose, deferredPrompt, onInstalled }: Props) {
  const [installing, setInstalling] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [platform, setPlatform] = useState<'desktop' | 'android' | 'ios' | 'other'>('other');

  // Detect platform and whether already installed.
  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) setPlatform('ios');
    else if (/android/.test(ua)) setPlatform('android');
    else if (/windows|macintosh|linux/.test(ua)) setPlatform('desktop');
  }, []);

  const handleInstall = async () => {
    // iOS doesn't support beforeinstallprompt — instructions only.
    if (platform === 'ios' || !deferredPrompt) return;

    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        onInstalled();
      }
    } catch {
      /* ignore */
    } finally {
      setInstalling(false);
      onInstalled();
      onClose();
    }
  };

  // Don't render if already running as a standalone app.
  if (isStandalone) return null;

  const iosInstructions = platform === 'ios';
  const canInstall = !!deferredPrompt && !iosInstructions;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] grid place-items-center p-4 bg-black/80 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-strong rounded-3xl w-full max-w-md p-7 relative overflow-hidden"
          >
            {/* Glow */}
            <div className="absolute -top-20 -right-20 w-48 h-48 bg-brand-500/30 rounded-full blur-3xl" />
            <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-cyan-400/20 rounded-full blur-3xl" />

            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-9 h-9 grid place-items-center rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative z-10">
              {/* Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-cyan-400 grid place-items-center mb-5 shadow-lg shadow-brand-500/30"
              >
                <Download className="w-8 h-8 text-white" />
              </motion.div>

              <h2 className="font-display font-extrabold text-2xl mb-2">
                Install Finflow 📲
              </h2>
              <p className="text-sm text-white/60 leading-relaxed mb-6">
                Add Finflow to your{' '}
                {platform === 'ios' ? 'Home Screen' : platform === 'android' ? 'Home screen' : 'desktop'}{' '}
                for quick access. It works offline, opens instantly, and feels just like a native app.
              </p>

              {/* Feature highlights */}
              <div className="space-y-2.5 mb-7">
                {[
                  { icon: '⚡', text: 'Opens instantly — no browser needed' },
                  { icon: '📱', text: 'Full-screen, distraction-free experience' },
                  { icon: '🔄', text: 'Your data syncs across all devices' },
                ].map((f) => (
                  <div key={f.text} className="flex items-center gap-3 text-sm text-white/70">
                    <span className="text-base">{f.icon}</span>
                    {f.text}
                  </div>
                ))}
              </div>

              {/* iOS instructions */}
              {iosInstructions ? (
                <div className="space-y-3">
                  <div className="glass rounded-2xl p-4 text-sm text-white/70 space-y-2">
                    <p className="font-semibold text-white/90 flex items-center gap-2">
                      <Monitor className="w-4 h-4 text-brand-400" />
                      How to install on iOS
                    </p>
                    <ol className="space-y-1.5 text-xs text-white/55 ml-6 list-decimal">
                      <li>Tap the <span className="font-semibold text-white/80">Share</span> button in Safari</li>
                      <li>Select <span className="font-semibold text-white/80">"Add to Home Screen"</span></li>
                      <li>Tap <span className="font-semibold text-white/80">"Add"</span> to confirm</li>
                    </ol>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold shadow-lg shadow-brand-500/30 transition-shadow"
                  >
                    <Check className="w-5 h-5" />
                    Got it
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white/70 font-semibold text-sm hover:bg-white/10 transition-colors"
                  >
                    Stay in browser
                  </button>
                  <button
                    onClick={handleInstall}
                    disabled={installing || !canInstall}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold text-sm shadow-lg shadow-brand-500/30 hover:shadow-brand-500/50 transition-shadow disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {installing ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Download className="w-5 h-5" />
                    )}
                    Install app
                  </button>
                </div>
              )}

              {!iosInstructions && !canInstall && (
                <p className="text-xs text-white/35 text-center mt-3">
                  If the button is disabled, use your browser menu → "Install app" or "Add to Home screen".
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

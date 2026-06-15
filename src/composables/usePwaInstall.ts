import { ref, readonly } from "vue";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null);
const canInstall = ref(false);
const installed = ref(false);
let bound = false;

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/** Gọi 1 lần ở main.ts để bắt sự kiện cài đặt sớm nhất. */
export function registerInstallPrompt(): void {
  if (bound) return;
  bound = true;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt.value = e as BeforeInstallPromptEvent;
    canInstall.value = true;
  });
  window.addEventListener("appinstalled", () => {
    installed.value = true;
    canInstall.value = false;
    deferredPrompt.value = null;
  });
}

export function usePwaInstall() {
  async function install(): Promise<boolean> {
    const e = deferredPrompt.value;
    if (!e) return false;
    await e.prompt();
    const choice = await e.userChoice;
    deferredPrompt.value = null;
    canInstall.value = false;
    return choice.outcome === "accepted";
  }

  return {
    canInstall: readonly(canInstall),
    installed: readonly(installed),
    standalone: isStandalone(),
    ios: isIos(),
    install,
  };
}

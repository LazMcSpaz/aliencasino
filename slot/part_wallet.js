// The shared wallet: one balance of gold bars across every game in the casino (shared by all games; lives in slot/ for now, like the sound engine).
// Inside the lobby, the lobby holds the balance (window.__alienWallet), so it carries from game to game.
// Opened on its own, a game keeps its balance in this browser's storage, so it survives a reload.
// Each engine does: let credits = Wallet.load(START); … Wallet.watch(() => credits)  (it saves whenever the balance changes).
const Wallet = (() => {
  const KEY = "alien-casino-bars", START = 500;
  const host = (() => { try { if (window.parent !== window && window.parent.__alienWallet) return window.parent.__alienWallet; } catch (e) {} return null; })();
  const read = () => { if (host) return host.get(); try { const v = localStorage.getItem(KEY); return v === null ? null : Number(v); } catch (e) { return null; } };
  const write = v => { if (host) return host.set(v); try { localStorage.setItem(KEY, String(v)); } catch (e) {} };
  return {
    load() { const v = read(); if (v !== null && Number.isFinite(v) && v >= 0) return Math.floor(v); write(START); return START; },
    watch(get) { let last = get(); const save = () => { const v = get(); if (v !== last && Number.isFinite(v)) { last = v; write(Math.floor(v)); } };
      setInterval(save, 250); addEventListener("pagehide", save); document.addEventListener("visibilitychange", save); }
  };
})();

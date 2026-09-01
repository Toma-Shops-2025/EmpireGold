import { Capacitor, registerPlugin } from "@capacitor/core";
import { toast } from "sonner";

interface UnityAdsPlugin {
  initialize(): Promise<{ success: boolean; error?: string }>;
  showRewarded(): Promise<{ success: boolean; rewarded?: boolean; error?: string }>;
  showInterstitial(): Promise<void>;
  showBanner(): Promise<void>;
  hideBanner(): Promise<void>;
}

const UnityAds = registerPlugin<UnityAdsPlugin>("UnityAds");

const isNative = () => Capacitor.isNativePlatform();

let initialized = false;
let initPromise: Promise<boolean> | null = null;

async function ensureInitialized(): Promise<boolean> {
  if (!isNative()) return false;
  if (initialized) return true;

  if (!initPromise) {
    initPromise = (async () => {
      try {
        const result = await UnityAds.initialize();
        if (result?.success) {
          initialized = true;
          console.log("Unity Ads initialized successfully");
          return true;
        }
        console.error("Unity Ads initialization failed:", result?.error);
        return false;
      } catch (error) {
        console.error("Unity Ads initialization error:", error);
        return false;
      } finally {
        if (!initialized) {
          initPromise = null;
        }
      }
    })();
  }

  return initPromise;
}

export async function initAds(): Promise<void> {
  await ensureInitialized();
}

export async function showRewardedAd(): Promise<{ success: boolean }> {
  if (!isNative()) {
    toast.info("Simulating Ad...");
    return { success: true };
  }

  try {
    const ready = await ensureInitialized();
    if (!ready) {
      toast.error("Ads not ready yet");
      return { success: false };
    }

    const result = await UnityAds.showRewarded();

    if (result?.success && result?.rewarded) {
      return { success: true };
    }

    toast.error("Video not completed - no reward earned");
    return { success: false };
  } catch (error) {
    console.error("Rewarded ad error:", error);
    toast.error("Rewarded ad unavailable");
    return { success: false };
  }
}

export async function showInterstitial(): Promise<void> {
  if (!isNative()) return;

  try {
    const ready = await ensureInitialized();
    if (!ready) return;
    await UnityAds.showInterstitial();
  } catch (error) {
    console.error("Interstitial ad error:", error);
  }
}

export async function setBannerVisible(visible: boolean): Promise<void> {
  if (!isNative()) return;

  try {
    const ready = await ensureInitialized();
    if (!ready) return;

    if (visible) {
      await UnityAds.showBanner();
    } else {
      await UnityAds.hideBanner();
    }
  } catch (error) {
    console.error("Banner ad error:", error);
  }
}

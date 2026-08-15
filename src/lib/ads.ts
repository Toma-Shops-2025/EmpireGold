import { Capacitor, registerPlugin } from "@capacitor/core";
import { toast } from "sonner";

interface UnityAdsPlugin {
  initialize(): Promise<{ success: boolean; error?: string }>;
  showRewarded(): Promise<{ success: boolean; rewarded?: boolean }>;
  showInterstitial(): Promise<void>;
  showBanner(): Promise<void>;
  hideBanner(): Promise<void>;
}

const UnityAds = registerPlugin<UnityAdsPlugin>("UnityAds");

const isNative = () => Capacitor.isNativePlatform();

let initialized = false;

export async function initAds(): Promise<void> {
  if (!isNative() || initialized) return;

  try {
    const result = await UnityAds.initialize();

    if (result?.success) {
      initialized = true;
      console.log("Unity Ads initialized successfully");
    } else {
      console.error("Unity Ads initialization failed:", result?.error);
    }
  } catch (error) {
    console.error("Unity Ads initialization error:", error);
  }
}

export async function showRewardedAd(): Promise<{ success: boolean }> {
  if (!isNative()) {
    toast.info("Simulating Ad...");
    return { success: true };
  }

  try {
    if (!initialized) {
      await initAds();
    }

    const result = await UnityAds.showRewarded();

    if (result?.success && result?.rewarded) {
      return { success: true };
    }

    toast.error("Video not completed - no cash earned");
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
    if (!initialized) {
      await initAds();
    }

    await UnityAds.showInterstitial();
  } catch (error) {
    console.error("Interstitial ad error:", error);
  }
}

export async function setBannerVisible(visible: boolean): Promise<void> {
  if (!isNative()) return;

  try {
    if (!initialized) {
      await initAds();
    }

    if (visible) {
      await UnityAds.showBanner();
    } else {
      await UnityAds.hideBanner();
    }
  } catch (error) {
    console.error("Banner ad error:", error);
  }
}

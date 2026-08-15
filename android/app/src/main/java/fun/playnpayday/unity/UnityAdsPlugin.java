package fun.playnpayday.unity;

import android.app.Activity;

import androidx.annotation.NonNull;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import com.unity3d.ads.UnityAds;
import com.unity3d.ads.core.data.model.UnityAdsError;
import com.unity3d.ads.initialization.IUnityAdsInitializationListener;

import com.unity3d.ads.load.AdLoadListener;
import com.unity3d.ads.load.LoadConfiguration;

import com.unity3d.ads.adplayer.AdPlayer;
import com.unity3d.ads.adplayer.ShowConfiguration;
import com.unity3d.ads.adplayer.ShowFinishState;
import com.unity3d.ads.adplayer.ShowListener;

import com.unity3d.ads.adplayer.model.ShowError;

import com.unity3d.ads.adplayer.legacy.LegacyAdPlayer;

import com.unity3d.ads.adplayer.legacy.LegacyShowListener;

import com.unity3d.ads.rewarded.RewardedAd;
import com.unity3d.ads.rewarded.RewardedAdShowListener;

import com.unity3d.ads.interstitial.InterstitialAd;
import com.unity3d.ads.interstitial.InterstitialAdShowListener;

import com.unity3d.ads.banner.BannerAd;
import com.unity3d.ads.banner.BannerLoadConfiguration;
import com.unity3d.ads.banner.BannerLoadListener;
import com.unity3d.ads.banner.BannerSize;

@CapacitorPlugin(name = "UnityAds")
public class UnityAdsPlugin extends Plugin {

    private static final String GAME_ID = "6168865";

    private RewardedAd rewardedAd;
    private InterstitialAd interstitialAd;
    private BannerAd bannerAd;

    @PluginMethod
    public void initialize(PluginCall call) {

        getActivity().runOnUiThread(() -> {

            try {

                com.unity3d.ads.InitializationConfiguration config =
                        new com.unity3d.ads.InitializationConfiguration.Builder(GAME_ID)
                                .withTestMode(true)
                                .build();

                UnityAds.initialize(
                        config,
                        error -> {

                            if (error == null) {

                                JSObject result = new JSObject();
                                result.put("success", true);

                                call.resolve(result);

                                loadRewardedInternal();
                                loadInterstitialInternal();
                                loadBannerInternal();

                            } else {

                                JSObject result = new JSObject();
                                result.put("success", false);
                                result.put("error", error.toString());

                                call.resolve(result);
                            }
                        }
                );

            } catch (Exception e) {

                call.reject("Unity Ads initialization failed", e);
            }
        });
    }

    private void loadRewardedInternal() {

        LoadConfiguration config =
                new LoadConfiguration.Builder("Rewarded_Android")
                        .build();

        RewardedAd.load(
                config,
                (ad, error) -> {

                    if (ad != null) {
                        rewardedAd = ad;
                        android.util.Log.d("UnityAdsPlugin", "Rewarded ad loaded");
                    } else {
                        android.util.Log.e(
                                "UnityAdsPlugin",
                                "Rewarded load failed: " + error
                        );
                    }
                }
        );
    }

    @PluginMethod
    public void showRewarded(PluginCall call) {

        getActivity().runOnUiThread(() -> {

            if (rewardedAd == null) {

                loadRewardedInternal();

                call.reject("Rewarded ad is not ready");
                return;
            }

            Activity activity = getActivity();

            ShowConfiguration config =
                    new ShowConfiguration.Builder()
                            .withCustomRewardString("gold_reward")
                            .build();

            rewardedAd.show(
                    activity,
                    config,
                    new RewardedAdShowListener() {

                        @Override
                        public void onRewarded(@NonNull RewardedAd ad) {

                            JSObject result = new JSObject();
                            result.put("success", true);
                            result.put("rewarded", true);

                            call.resolve(result);
                        }

                        @Override
                        public void onStarted(@NonNull RewardedAd ad) {
                        }

                        @Override
                        public void onClicked(@NonNull RewardedAd ad) {
                        }

                        @Override
                        public void onCompleted(
                                @NonNull RewardedAd ad,
                                @NonNull ShowFinishState state
                        ) {

                            if (state != ShowFinishState.COMPLETED) {

                                JSObject result = new JSObject();
                                result.put("success", false);
                                result.put("rewarded", false);

                                call.resolve(result);
                            }

                            rewardedAd = null;
                            loadRewardedInternal();
                        }

                        @Override
                        public void onFailed(
                                @NonNull RewardedAd ad,
                                @NonNull UnityAdsError error
                        ) {

                            call.reject("Rewarded ad failed: " + error);

                            rewardedAd = null;
                            loadRewardedInternal();
                        }
                    }
            );
        });
    }

    private void loadInterstitialInternal() {

        LoadConfiguration config =
                new LoadConfiguration.Builder("Interstitial_Android")
                        .build();

        InterstitialAd.load(
                config,
                (ad, error) -> {

                    if (ad != null) {

                        interstitialAd = ad;

                        android.util.Log.d(
                                "UnityAdsPlugin",
                                "Interstitial loaded"
                        );

                    } else {

                        android.util.Log.e(
                                "UnityAdsPlugin",
                                "Interstitial load failed: " + error
                        );
                    }
                }
        );
    }

    @PluginMethod
    public void showInterstitial(PluginCall call) {

        getActivity().runOnUiThread(() -> {

            if (interstitialAd == null) {

                loadInterstitialInternal();
                call.resolve();
                return;
            }

            ShowConfiguration config =
                    new ShowConfiguration.Builder()
                            .build();

            interstitialAd.show(
                    getActivity(),
                    config,
                    new InterstitialAdShowListener() {

                        @Override
                        public void onStarted(@NonNull InterstitialAd ad) {
                        }

                        @Override
                        public void onClicked(@NonNull InterstitialAd ad) {
                        }

                        @Override
                        public void onCompleted(
                                @NonNull InterstitialAd ad,
                                @NonNull ShowFinishState state
                        ) {

                            interstitialAd = null;
                            loadInterstitialInternal();
                            call.resolve();
                        }

                        @Override
                        public void onFailed(
                                @NonNull InterstitialAd ad,
                                @NonNull UnityAdsError error
                        ) {

                            interstitialAd = null;
                            loadInterstitialInternal();

                            call.reject(
                                    "Interstitial failed: " + error
                            );
                        }
                    }
            );
        });
    }

    private void loadBannerInternal() {

        BannerSize size = new BannerSize(320, 50);

        BannerLoadConfiguration config =
                new BannerLoadConfiguration.Builder(
                        "Banner_Android",
                        size
                ).build();

        BannerAd.load(
                config,
                (ad, error) -> {

                    if (ad != null) {

                        bannerAd = ad;

                        android.util.Log.d(
                                "UnityAdsPlugin",
                                "Banner loaded"
                        );

                    } else {

                        android.util.Log.e(
                                "UnityAdsPlugin",
                                "Banner load failed: " + error
                        );
                    }
                }
        );
    }

    @PluginMethod
    public void showBanner(PluginCall call) {

        getActivity().runOnUiThread(() -> {

            if (bannerAd == null) {

                loadBannerInternal();
                call.resolve();
                return;
            }

            bannerAd.show();

            call.resolve();
        });
    }

    @PluginMethod
    public void hideBanner(PluginCall call) {

        getActivity().runOnUiThread(() -> {

            if (bannerAd != null) {
                bannerAd.destroy();
                bannerAd = null;
            }

            call.resolve();
        });
    }
}
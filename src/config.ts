export const CONFIG = {
    APP_NAME: "Empire Gold",
    IS_TESTING: false, // Set to false for production

    // ADMOB IDS - Pulling from Netlify Env Vars
    ADMOB_APP_ID: import.meta.env.VITE_ADMOB_APP_ID || "ca-app-pub-3940256099942544~3347511713",
    ADMOB_BANNER_ID: "ca-app-pub-3940256099942544/6300978111",
    ADMOB_INTERSTITIAL_ID: "ca-app-pub-3940256099942544/1033173712",
    ADMOB_REWARDED_ID: import.meta.env.VITE_ADMOB_REWARDED_ID || "ca-app-pub-3940256099942544/5224354917",

    // REWARD CONFIG
    ULTIMATE_GOAL: 50.00,
    MILESTONES: [5.00, 10.00, 25.00, 50.00]
}

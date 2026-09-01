export const CONFIG = {
  APP_NAME: "Play 'n Payday",
  VERSION: "1.3",
  DOMAIN: "playnpayday.fun",
  PRIVACY_URL: "https://playnpayday.fun/privacy",
  TERMS_URL: "https://playnpayday.fun/terms",
  IS_TESTING: false,

  /**
   * Score units sent to claim_game_reward for a rewarded ad.
   * Server: ~100000 score ≈ $1.00 → 2000 score ≈ $0.02.
   */
  REWARDED_AD_SCORE: 2000,
  REWARDED_AD_LABEL: "$0.02",
};


import { PlatformManager, Platform } from './PlatformAdapter';

/**
 * 多平台广告管理器
 * 支持：Poki, CrazyGames, GameDistribution (Azerion), Telegram Games
 */
export class AdsManager {
  private platformManager: PlatformManager;
  
  constructor() {
    this.platformManager = new PlatformManager();
  }

  /**
   * 初始化平台适配器
   */
  async init(): Promise<void> {
    await this.platformManager.init();
  }

  /**
   * 获取当前平台
   */
  getPlatform(): Platform {
    return this.platformManager.getPlatform();
  }

  /**
   * Shows a full-screen loading ad before the game begins.
   */
  async showLoadingAd(): Promise<void> {
    // Telegram Games 不允许广告，直接跳过
    if (this.platformManager.isPlatform(Platform.TELEGRAM)) {
      console.log("[ADS] Telegram platform detected, skipping ads");
      return new Promise(resolve => setTimeout(resolve, 500));
    }
    
    const adapter = this.platformManager.getAdapter();
    const shown = await adapter.showAd('loading');
    
    if (!shown) {
      // 如果没有平台广告，使用默认延迟
      console.log("[ADS] No platform ad, using default delay");
      return new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  /**
   * Shows an interstitial ad between levels or on game over.
   */
  async showInterstitialAd(): Promise<void> {
    // Telegram Games 不允许广告，直接跳过
    if (this.platformManager.isPlatform(Platform.TELEGRAM)) {
      console.log("[ADS] Telegram platform detected, skipping ads");
      return;
    }
    
    const adapter = this.platformManager.getAdapter();
    await adapter.showAd('interstitial');
  }

  /**
   * Shows a rewarded video ad for in-game bonuses.
   * @returns Promise<boolean> - True if the user watched the full ad.
   */
  async showRewardedAd(): Promise<boolean> {
    // Telegram Games 不允许广告，直接返回false
    if (this.platformManager.isPlatform(Platform.TELEGRAM)) {
      console.log("[ADS] Telegram platform detected, skipping ads");
      return false;
    }
    
    const adapter = this.platformManager.getAdapter();
    const result = await adapter.showAd('rewarded');
    
    if (!result) {
      // 独立模式下显示占位符
      if (this.platformManager.isPlatform(Platform.STANDALONE)) {
        return new Promise(resolve => {
          const success = confirm("观看完整广告可获得奖励？\n(独立模式下为占位符)");
          resolve(success);
        });
      }
    }
    
    return result;
  }

  /**
   * 设置加载进度（Poki平台）
   */
  setLoadingProgress(progress: number): void {
    const adapter = this.platformManager.getAdapter();
    if (adapter.setLoadingProgress) {
      adapter.setLoadingProgress(progress);
    }
  }

  /**
   * 通知平台游戏开始
   */
  gameplayStart(): void {
    const adapter = this.platformManager.getAdapter();
    if (adapter.gameplayStart) {
      adapter.gameplayStart();
    }
  }

  /**
   * 通知平台游戏停止
   */
  gameplayStop(): void {
    const adapter = this.platformManager.getAdapter();
    if (adapter.gameplayStop) {
      adapter.gameplayStop();
    }
  }

  /**
   * 通知平台游戏进入"快乐时光"（Poki）
   */
  happyTime(): void {
    const adapter = this.platformManager.getAdapter();
    if (adapter.happyTime) {
      adapter.happyTime();
    }
  }
}

/**
 * 多平台适配器
 * 支持：Poki, CrazyGames, GameDistribution (Azerion), Telegram Games
 */

export enum Platform {
  STANDALONE = 'standalone',
  POKI = 'poki',
  CRAZYGAMES = 'crazygames',
  AZERION = 'azerion',
  TELEGRAM = 'telegram'
}

export interface PlatformSDK {
  platform: Platform;
  name: string;
  isAvailable: boolean;
  init(): Promise<void>;
  showAd(type: 'loading' | 'interstitial' | 'rewarded'): Promise<boolean>;
  setLoadingProgress?(progress: number): void;
  gameplayStart?(): void;
  gameplayStop?(): void;
  happyTime?(): void;
}

/**
 * 检测当前运行平台
 */
export function detectPlatform(): Platform {
  // 检查 Telegram
  if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
    return Platform.TELEGRAM;
  }
  
  // 检查 Poki
  if (typeof window !== 'undefined' && (window as any).poki) {
    return Platform.POKI;
  }
  
  // 检查 CrazyGames
  if (typeof window !== 'undefined' && (window as any).CrazyGames) {
    return Platform.CRAZYGAMES;
  }
  
  // 检查 Azerion/GameDistribution
  if (typeof window !== 'undefined' && (window as any).GD_SDK) {
    return Platform.AZERION;
  }
  
  return Platform.STANDALONE;
}

/**
 * Poki 平台适配器
 */
class PokiAdapter implements PlatformSDK {
  platform = Platform.POKI;
  name = 'Poki';
  isAvailable = false;
  private poki: any;

  async init(): Promise<void> {
    if (typeof window === 'undefined') return;
    
    this.poki = (window as any).poki;
    if (this.poki) {
      this.isAvailable = true;
      try {
        await this.poki.init();
        console.log('[Platform] Poki SDK initialized');
      } catch (e) {
        console.warn('[Platform] Poki init failed:', e);
      }
    }
  }

  async showAd(type: 'loading' | 'interstitial' | 'rewarded'): Promise<boolean> {
    if (!this.isAvailable || !this.poki) return false;

    try {
      switch (type) {
        case 'loading':
          await this.poki.gameLoadingStart();
          return true;
        case 'interstitial':
          await this.poki.commercialBreak();
          return true;
        case 'rewarded':
          const result = await this.poki.rewardedBreak();
          return result;
        default:
          return false;
      }
    } catch (e) {
      console.warn(`[Platform] Poki ${type} ad failed:`, e);
      return false;
    }
  }

  setLoadingProgress(progress: number): void {
    if (this.isAvailable && this.poki?.gameLoadingProgress) {
      this.poki.gameLoadingProgress(progress);
    }
  }

  gameplayStart(): void {
    if (this.isAvailable && this.poki?.gameplayStart) {
      this.poki.gameplayStart();
    }
  }

  gameplayStop(): void {
    if (this.isAvailable && this.poki?.gameplayStop) {
      this.poki.gameplayStop();
    }
  }

  happyTime(): void {
    if (this.isAvailable && this.poki?.happyTime) {
      this.poki.happyTime();
    }
  }
}

/**
 * CrazyGames 平台适配器
 */
class CrazyGamesAdapter implements PlatformSDK {
  platform = Platform.CRAZYGAMES;
  name = 'CrazyGames';
  isAvailable = false;
  private sdk: any;

  async init(): Promise<void> {
    if (typeof window === 'undefined') return;
    
    this.sdk = (window as any).CrazyGames;
    if (this.sdk) {
      this.isAvailable = true;
      try {
        this.sdk.SDK.init();
        console.log('[Platform] CrazyGames SDK initialized');
      } catch (e) {
        console.warn('[Platform] CrazyGames init failed:', e);
      }
    }
  }

  async showAd(type: 'loading' | 'interstitial' | 'rewarded'): Promise<boolean> {
    if (!this.isAvailable || !this.sdk) return false;

    try {
      switch (type) {
        case 'loading':
          // CrazyGames 没有专门的加载广告
          return false;
        case 'interstitial':
          await this.sdk.SDK.ad.requestAd('midgame');
          return true;
        case 'rewarded':
          const result = await this.sdk.SDK.ad.requestAd('rewarded');
          return result;
        default:
          return false;
      }
    } catch (e) {
      console.warn(`[Platform] CrazyGames ${type} ad failed:`, e);
      return false;
    }
  }

  gameplayStart(): void {
    if (this.isAvailable && this.sdk?.SDK?.gameplay?.start) {
      this.sdk.SDK.gameplay.start();
    }
  }

  gameplayStop(): void {
    if (this.isAvailable && this.sdk?.SDK?.gameplay?.stop) {
      this.sdk.SDK.gameplay.stop();
    }
  }

  happyTime(): void {
    if (this.isAvailable && this.sdk?.SDK?.gameplay?.happyTime) {
      this.sdk.SDK.gameplay.happyTime();
    }
  }
}

/**
 * Azerion/GameDistribution 平台适配器
 */
class AzerionAdapter implements PlatformSDK {
  platform = Platform.AZERION;
  name = 'Azerion';
  isAvailable = false;
  private sdk: any;

  async init(): Promise<void> {
    if (typeof window === 'undefined') return;
    
    this.sdk = (window as any).GD_SDK;
    if (this.sdk) {
      this.isAvailable = true;
      try {
        await this.sdk.init();
        console.log('[Platform] Azerion SDK initialized');
      } catch (e) {
        console.warn('[Platform] Azerion init failed:', e);
      }
    }
  }

  async showAd(type: 'loading' | 'interstitial' | 'rewarded'): Promise<boolean> {
    if (!this.isAvailable || !this.sdk) return false;

    try {
      switch (type) {
        case 'loading':
          await this.sdk.showAd('preroll');
          return true;
        case 'interstitial':
          await this.sdk.showAd('midroll');
          return true;
        case 'rewarded':
          const result = await this.sdk.showAd('rewarded');
          return result;
        default:
          return false;
      }
    } catch (e) {
      console.warn(`[Platform] Azerion ${type} ad failed:`, e);
      return false;
    }
  }

  gameplayStart(): void {
    if (this.isAvailable && this.sdk?.gameplay?.start) {
      this.sdk.gameplay.start();
    }
  }

  gameplayStop(): void {
    if (this.isAvailable && this.sdk?.gameplay?.stop) {
      this.sdk.gameplay.stop();
    }
  }
}

/**
 * Telegram 平台适配器
 */
class TelegramAdapter implements PlatformSDK {
  platform = Platform.TELEGRAM;
  name = 'Telegram';
  isAvailable = false;
  private webApp: any;

  async init(): Promise<void> {
    if (typeof window === 'undefined') return;
    
    this.webApp = (window as any).Telegram?.WebApp;
    if (this.webApp) {
      this.isAvailable = true;
      try {
        this.webApp.ready();
        this.webApp.expand();
        console.log('[Platform] Telegram WebApp initialized');
      } catch (e) {
        console.warn('[Platform] Telegram init failed:', e);
      }
    }
  }

  async showAd(type: 'loading' | 'interstitial' | 'rewarded'): Promise<boolean> {
    // Telegram 不直接支持广告，但可以通过其他方式实现
    // 这里返回 false，让游戏继续运行
    return false;
  }

  gameplayStart(): void {
    if (this.isAvailable && this.webApp) {
      // Telegram Games: 仅发送游戏状态，不发送任何用户数据给第三方
      // 注意：sendData 仅发送给游戏自己的后端，不违反Telegram规则
      try {
        this.webApp.sendData(JSON.stringify({ action: 'gameplay_start' }));
      } catch (e) {
        // 静默处理错误，不影响游戏运行
        console.log('[Platform] Telegram sendData failed (this is normal if no backend)');
      }
    }
  }

  gameplayStop(): void {
    if (this.isAvailable && this.webApp) {
      // Telegram Games: 仅发送游戏状态，不发送任何用户数据给第三方
      try {
        this.webApp.sendData(JSON.stringify({ action: 'gameplay_stop' }));
      } catch (e) {
        // 静默处理错误，不影响游戏运行
        console.log('[Platform] Telegram sendData failed (this is normal if no backend)');
      }
    }
  }
}

/**
 * 独立运行适配器（无平台）
 */
class StandaloneAdapter implements PlatformSDK {
  platform = Platform.STANDALONE;
  name = 'Standalone';
  isAvailable = true;

  async init(): Promise<void> {
    console.log('[Platform] Running in standalone mode');
  }

  async showAd(type: 'loading' | 'interstitial' | 'rewarded'): Promise<boolean> {
    // 独立模式下，可以显示占位符或跳过
    if (type === 'loading') {
      // 模拟加载延迟
      return new Promise(resolve => setTimeout(() => resolve(true), 500));
    }
    return false;
  }
}

/**
 * 平台管理器
 */
export class PlatformManager {
  private adapter: PlatformSDK;
  private currentPlatform: Platform;

  constructor() {
    this.currentPlatform = detectPlatform();
    
    switch (this.currentPlatform) {
      case Platform.POKI:
        this.adapter = new PokiAdapter();
        break;
      case Platform.CRAZYGAMES:
        this.adapter = new CrazyGamesAdapter();
        break;
      case Platform.AZERION:
        this.adapter = new AzerionAdapter();
        break;
      case Platform.TELEGRAM:
        this.adapter = new TelegramAdapter();
        break;
      default:
        this.adapter = new StandaloneAdapter();
    }
  }

  async init(): Promise<void> {
    await this.adapter.init();
  }

  getPlatform(): Platform {
    return this.currentPlatform;
  }

  getAdapter(): PlatformSDK {
    return this.adapter;
  }

  isPlatform(platform: Platform): boolean {
    return this.currentPlatform === platform;
  }
}


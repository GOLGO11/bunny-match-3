
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../i18n/useTranslation';

interface SettingsPanelProps {
  audioManager: any; // AudioManager 实例
  onPause: () => void;
  onResume: () => void;
  isPaused: boolean;
  gameState: 'start' | 'loading' | 'playing' | 'gameover' | 'noMoves';
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  audioManager,
  onPause,
  onResume,
  isPaused,
  gameState
}) => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const panelRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<number | null>(null);
  
  // 检测是否为移动设备
  const [isMobile, setIsMobile] = useState(false);
  
  // 触摸手势相关
  const touchStartY = useRef<number | null>(null);
  const touchStartTime = useRef<number | null>(null);
  const minSwipeDistance = 50; // 最小滑动距离（像素）
  const maxSwipeTime = 500; // 最大滑动时间（毫秒）

  // 检测是否为移动设备
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                            (window.matchMedia && window.matchMedia('(max-width: 768px)').matches);
      setIsMobile(isMobileDevice);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 从 localStorage 读取设置
  useEffect(() => {
    const savedMusic = localStorage.getItem('game-music-enabled');
    const savedSound = localStorage.getItem('game-sound-enabled');
    
    if (savedMusic !== null) {
      const enabled = savedMusic === 'true';
      setMusicEnabled(enabled);
      audioManager.setMusicEnabled(enabled);
    }
    
    if (savedSound !== null) {
      const enabled = savedSound === 'true';
      setSoundEnabled(enabled);
      audioManager.setEnabled(enabled);
    }
  }, [audioManager]);

  // PC端：监听鼠标移到header区域
  useEffect(() => {
    if (isMobile) return; // 移动端不使用鼠标事件

    const handleMouseMove = (e: MouseEvent) => {
      if (gameState !== 'playing') {
        setIsVisible(false);
        return;
      }

      // 检查鼠标是否在设置面板上
      const panel = panelRef.current;
      let isOnPanel = false;
      if (panel) {
        const panelRect = panel.getBoundingClientRect();
        isOnPanel = 
          e.clientX >= panelRect.left && 
          e.clientX <= panelRect.right && 
          e.clientY >= panelRect.top && 
          e.clientY <= panelRect.bottom;
      }

      // 检查鼠标是否在header区域
      const header = document.querySelector('.game-header');
      let isOnHeader = false;
      if (header) {
        const headerRect = header.getBoundingClientRect();
        isOnHeader = 
          e.clientX >= headerRect.left && 
          e.clientX <= headerRect.right && 
          e.clientY >= headerRect.top && 
          e.clientY <= headerRect.bottom;
      }

      // 如果鼠标在header或设置面板上，显示面板
      if (isOnHeader || isOnPanel) {
        // 清除隐藏定时器
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        setIsVisible(true);
      } else {
        // 鼠标不在header和面板上，延迟隐藏
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        // 延迟隐藏，避免鼠标快速移动时闪烁
        timeoutRef.current = window.setTimeout(() => {
          setIsVisible(false);
        }, 200);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [gameState, isMobile]);

  // 移动端：监听下拉/上拉手势和点击外部区域
  useEffect(() => {
    if (!isMobile) return; // PC端不使用触摸事件

    const handleTouchStart = (e: TouchEvent) => {
      if (gameState !== 'playing') return;
      
      const touch = e.touches[0];
      const panel = panelRef.current;
      
      // 如果面板已显示，检查是否从面板内开始触摸
      if (isVisible && panel) {
        const panelRect = panel.getBoundingClientRect();
        const isOnPanel = 
          touch.clientX >= panelRect.left && 
          touch.clientX <= panelRect.right && 
          touch.clientY >= panelRect.top && 
          touch.clientY <= panelRect.bottom;
        
        // 如果从面板内开始，记录触摸位置（用于上拉关闭）
        if (isOnPanel) {
          touchStartY.current = touch.clientY;
          touchStartTime.current = Date.now();
          return;
        }
      }
      
      // 如果面板未显示，只处理从屏幕顶部开始的触摸（用于下拉打开）
      if (!isVisible && touch.clientY <= 100) {
        touchStartY.current = touch.clientY;
        touchStartTime.current = Date.now();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (gameState !== 'playing') return;
      if (touchStartY.current === null) return;
      
      // 如果面板已显示，允许上拉关闭，不阻止默认行为
      if (isVisible) {
        return;
      }
      
      // 如果面板未显示，阻止默认滚动行为（下拉打开时）
      e.preventDefault();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (gameState !== 'playing') return;
      
      const touch = e.changedTouches[0];
      const panel = panelRef.current;
      
      // 检查触摸是否在面板内
      let isTouchInside = false;
      if (panel) {
        const panelRect = panel.getBoundingClientRect();
        isTouchInside = 
          touch.clientX >= panelRect.left && 
          touch.clientX <= panelRect.right && 
          touch.clientY >= panelRect.top && 
          touch.clientY <= panelRect.bottom;
      }
      
      if (touchStartY.current !== null && touchStartTime.current !== null) {
        const touchEndY = touch.clientY;
        const touchEndTime = Date.now();
        
        const deltaY = touchEndY - touchStartY.current;
        const deltaTime = touchEndTime - touchStartTime.current;
        const absDeltaY = Math.abs(deltaY);

        if (isVisible) {
          // 面板已显示：检测上拉手势（向上滑动）关闭面板
          if (deltaY < -minSwipeDistance && deltaTime < maxSwipeTime) {
            setIsVisible(false);
          } else if (absDeltaY < 20 && !isTouchInside) {
            // 如果不是手势滑动（滑动距离很小），且触摸在面板外，关闭面板
            setIsVisible(false);
          }
        } else {
          // 面板未显示：检测下拉手势（向下滑动）打开面板
          if (deltaY > minSwipeDistance && deltaTime < maxSwipeTime) {
            setIsVisible(true);
          }
        }
      }

      // 重置触摸状态
      touchStartY.current = null;
      touchStartTime.current = null;
    };

    // 点击外部区域关闭面板（仅处理点击事件，触摸事件在 handleTouchEnd 中处理）
    const handleClickOutside = (e: MouseEvent) => {
      if (gameState !== 'playing' || !isVisible) return;
      
      const panel = panelRef.current;
      if (!panel) return;
      
      const panelRect = panel.getBoundingClientRect();
      const isClickInside = 
        e.clientX >= panelRect.left && 
        e.clientX <= panelRect.right && 
        e.clientY >= panelRect.top && 
        e.clientY <= panelRect.bottom;
      
      if (!isClickInside) {
        setIsVisible(false);
      }
    };

    // 在document上监听触摸事件，以便在整个屏幕范围内检测下拉手势
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    // 点击外部区域关闭（仅PC端，移动端通过触摸事件处理）
    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [gameState, isMobile, isVisible]);

  // 游戏不在进行时隐藏面板
  useEffect(() => {
    if (gameState !== 'playing') {
      setIsVisible(false);
    }
  }, [gameState]);

  const handleMusicToggle = () => {
    const newValue = !musicEnabled;
    setMusicEnabled(newValue);
    audioManager.setMusicEnabled(newValue);
    localStorage.setItem('game-music-enabled', String(newValue));
  };

  const handleSoundToggle = () => {
    const newValue = !soundEnabled;
    console.log(`[Settings] 音效开关切换: ${soundEnabled} -> ${newValue}`);
    setSoundEnabled(newValue);
    audioManager.setEnabled(newValue);
    localStorage.setItem('game-sound-enabled', String(newValue));
    // 验证设置是否生效
    console.log(`[Settings] 音效开关已设置为: ${newValue}, audioManager.soundEnabled 应该是: ${newValue}`);
  };

  const handlePauseToggle = () => {
    if (isPaused) {
      onResume();
    } else {
      onPause();
    }
  };

  if (gameState !== 'playing') return null;

  return (
    <div
      ref={panelRef}
      className={`fixed top-0 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-500 ease-out ${
        isVisible 
          ? 'translate-y-0 opacity-100' 
          : '-translate-y-full opacity-0 pointer-events-none'
      }`}
    >
      <div className="bg-slate-800/95 backdrop-blur-md border-2 border-slate-600 rounded-b-2xl shadow-2xl px-4 py-3 flex items-center gap-3 sm:gap-4">
        {/* 音乐开关 */}
        <button
          onClick={handleMusicToggle}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
            musicEnabled
              ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/50'
              : 'bg-slate-700/50 hover:bg-slate-700/70 text-slate-400 border border-slate-600/50'
          }`}
          title={musicEnabled ? t.settings?.musicOn || '音乐: 开' : t.settings?.musicOff || '音乐: 关'}
        >
          <span className="text-lg sm:text-xl">
            {musicEnabled ? '🎵' : '🔇'}
          </span>
          <span className="text-xs sm:text-sm font-semibold hidden sm:inline">
            {musicEnabled ? (t.settings?.music || '音乐') : (t.settings?.music || '音乐')}
          </span>
        </button>

        {/* 音效开关 */}
        <button
          onClick={handleSoundToggle}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
            soundEnabled
              ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/50'
              : 'bg-slate-700/50 hover:bg-slate-700/70 text-slate-400 border border-slate-600/50'
          }`}
          title={soundEnabled ? t.settings?.soundOn || '音效: 开' : t.settings?.soundOff || '音效: 关'}
        >
          <span className="text-lg sm:text-xl">
            {soundEnabled ? '🔊' : '🔇'}
          </span>
          <span className="text-xs sm:text-sm font-semibold hidden sm:inline">
            {soundEnabled ? (t.settings?.sound || '音效') : (t.settings?.sound || '音效')}
          </span>
        </button>

        {/* 暂停开关 */}
        <button
          onClick={handlePauseToggle}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
            isPaused
              ? 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/50'
              : 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/50'
          }`}
          title={isPaused ? t.settings?.resume || '继续' : t.settings?.pause || '暂停'}
        >
          <span className="text-lg sm:text-xl">
            {isPaused ? '▶️' : '⏸️'}
          </span>
          <span className="text-xs sm:text-sm font-semibold hidden sm:inline">
            {isPaused ? (t.settings?.resume || '继续') : (t.settings?.pause || '暂停')}
          </span>
        </button>
      </div>
    </div>
  );
};


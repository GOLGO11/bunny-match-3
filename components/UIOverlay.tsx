
import React, { useState, useEffect } from 'react';
import { Difficulty, DIFFICULTY_CONFIG } from '../constants';
import { useTranslation } from '../i18n/useTranslation';

interface UIOverlayProps {
  state: 'start' | 'loading' | 'playing' | 'gameover' | 'noMoves';
  score: number;
  onStart: (difficulty?: Difficulty) => void;
  onRestart: () => void;
  onRewardedAd: () => void;
  currentDifficulty?: Difficulty;
}

export const UIOverlay: React.FC<UIOverlayProps> = ({ state, score, onStart, onRestart, onRewardedAd, currentDifficulty = Difficulty.MEDIUM }) => {
  const { t } = useTranslation();
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(currentDifficulty);
  const [isLandscape, setIsLandscape] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // 当currentDifficulty改变时更新selectedDifficulty
  useEffect(() => {
    setSelectedDifficulty(currentDifficulty);
  }, [currentDifficulty]);

  // 检测横屏/竖屏和设备类型
  useEffect(() => {
    const checkOrientation = () => {
      const isLandscapeMode = window.innerWidth > window.innerHeight;
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                            (window.matchMedia && window.matchMedia('(max-width: 1024px)').matches);
      
      setIsLandscape(isLandscapeMode);
      setIsMobile(isMobileDevice);
    };
    
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  if (state === 'playing') return null;
  
  // 移动端横屏：使用专门的横屏布局；其他情况：使用默认布局
  const isMobileLandscape = isMobile && isLandscape;
  const maxWidthClass = isMobileLandscape ? 'max-w-4xl' : 'max-w-sm';

  return (
    <div className="absolute inset-0 bg-transparent backdrop-blur-sm flex flex-col items-center justify-center z-50 p-3 sm:p-4 md:p-6 text-center animate-in fade-in duration-300 overflow-y-auto">
      {state === 'start' && (
        <div className="flex flex-col items-center max-w-md w-full bg-gradient-to-br from-pink-50/10 via-purple-50/10 to-blue-50/10 border-2 border-pink-300/30 p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-2xl backdrop-blur-xl relative overflow-hidden my-2 sm:my-4">
          {/* 装饰性背景元素 - 使用自定义动画 */}
          <div className="absolute top-4 left-4 text-2xl animate-sparkle" style={{ animationDelay: '0s' }}>✨</div>
          <div className="absolute top-8 right-6 text-xl animate-float" style={{ animationDelay: '0.2s' }}>💫</div>
          <div className="absolute bottom-6 left-6 text-xl animate-sparkle" style={{ animationDelay: '0.4s' }}>⭐</div>
          <div className="absolute bottom-8 right-4 text-2xl animate-float" style={{ animationDelay: '0.6s' }}>🌟</div>
          <div className="absolute top-1/2 left-2 text-lg animate-wiggle" style={{ animationDelay: '0.3s' }}>💖</div>
          <div className="absolute top-1/2 right-2 text-lg animate-wiggle" style={{ animationDelay: '0.7s' }}>💖</div>
          
          {/* 主标题区域 */}
          <div className="relative z-10 flex flex-col items-center">
            {/* 多个兔子emoji，不同动画 */}
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
              <div className="text-4xl sm:text-5xl md:text-6xl animate-float" style={{ animationDelay: '0s', animationDuration: '1.2s' }}>🐰</div>
              <div className="text-5xl sm:text-6xl md:text-7xl animate-float" style={{ animationDelay: '0.2s', animationDuration: '1.4s' }}>🐰</div>
              <div className="text-4xl sm:text-5xl md:text-6xl animate-float" style={{ animationDelay: '0.4s', animationDuration: '1.3s' }}>🐰</div>
            </div>
            
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-500 via-pink-500 to-blue-400 mb-1.5 sm:mb-2 animate-pulse px-2 whitespace-nowrap">
              {t.gameTitle}
            </h1>
            <div className="flex items-center gap-1 mb-2 sm:mb-3">
              <span className="text-sm sm:text-base animate-wiggle" style={{ animationDelay: '0s' }}>🐾</span>
              <p className="text-pink-200 text-[10px] sm:text-xs font-semibold whitespace-nowrap">{t.gameSubtitle}</p>
              <span className="text-sm sm:text-base animate-wiggle" style={{ animationDelay: '0.2s' }}>🐾</span>
            </div>
            
            {/* 可爱的描述文字 */}
            <div className="bg-pink-500/20 border border-pink-400/30 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 mb-3 sm:mb-4 backdrop-blur-sm">
              <p className="text-pink-100 text-[10px] sm:text-xs leading-tight text-center whitespace-pre-line">
                {t.startScreen.description}
              </p>
            </div>
          </div>
          
          <div className="w-full space-y-3 sm:space-y-4 relative z-10">
            {/* 难度选择 */}
            <div className="mb-2.5 sm:mb-3">
              <p className="text-pink-200 text-[10px] sm:text-xs font-semibold mb-1.5 sm:mb-2 text-center">{t.startScreen.selectDifficulty}</p>
              <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
                {Object.values(Difficulty).map((diff) => {
                  const config = DIFFICULTY_CONFIG[diff];
                  const isSelected = selectedDifficulty === diff;
                  const diffKey = diff as keyof typeof t.difficulty;
                  return (
                    <button
                      key={diff}
                      onClick={() => setSelectedDifficulty(diff)}
                      className={`py-1.5 sm:py-2 px-1 rounded-lg sm:rounded-xl transition-all transform ${
                        isSelected
                          ? 'bg-gradient-to-r from-pink-400 to-purple-500 text-white scale-105 shadow-lg border-2 border-pink-300'
                          : 'bg-pink-500/20 border border-pink-400/30 text-pink-200 hover:bg-pink-500/30 hover:scale-102'
                      }`}
                    >
                      <div className="text-lg sm:text-xl mb-0.5">{config.icon}</div>
                      <div className="text-[9px] sm:text-[10px] font-bold leading-tight">{t.difficulty[diffKey].name}</div>
                      <div className="text-[8px] sm:text-[9px] opacity-80 mt-0.5 leading-tight line-clamp-2">{t.difficulty[diffKey].description}</div>
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* 主按钮 - 更可爱 */}
            <button 
              onClick={() => onStart(selectedDifficulty)}
              className="w-full py-3 sm:py-4 bg-gradient-to-r from-pink-400 via-purple-500 to-pink-400 hover:from-pink-500 hover:via-purple-600 hover:to-pink-500 text-white font-bold text-base sm:text-lg rounded-xl transition-all active:scale-95 shadow-lg transform hover:scale-105 relative overflow-hidden group"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <span className="text-lg sm:text-xl animate-bounce inline-block">🎮</span>
                <span className="whitespace-nowrap">{t.startScreen.startGame}</span>
                <span className="text-lg sm:text-xl animate-bounce inline-block" style={{ animationDelay: '0.1s' }}>✨</span>
              </span>
              {/* 按钮光效 */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            </button>
          </div>
        </div>
      )}

      {state === 'loading' && (
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <h2 className="text-xl font-bold">{t.loading.title}</h2>
          <p className="text-slate-400 mt-2">{t.loading.subtitle}</p>
        </div>
      )}

      {state === 'gameover' && (
        isMobileLandscape ? (
          // 移动端横屏布局：垂直布局但更紧凑，可滚动
          <div className={`flex flex-col items-center w-full max-w-lg bg-gradient-to-br from-yellow-50/10 via-orange-50/10 to-pink-50/10 border-2 border-yellow-300/30 p-4 pb-6 rounded-2xl shadow-2xl backdrop-blur-xl relative overflow-y-auto max-h-[85vh] my-2`}>
            {/* 装饰性背景元素 - 减少数量 */}
            <div className="absolute top-2 left-2 text-base animate-sparkle">⏰</div>
            <div className="absolute top-2 right-3 text-base animate-float">🎉</div>
            
            {/* 图标和标题 */}
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <div className="text-2xl animate-float" style={{ animationDelay: '0s' }}>🐰</div>
              <div className="text-3xl animate-float" style={{ animationDelay: '0.2s' }}>⏰</div>
              <div className="text-2xl animate-float" style={{ animationDelay: '0.4s' }}>🐰</div>
            </div>
            
            <h1 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 mb-2 animate-pulse text-center">
              {t.gameOver.timeUp}
            </h1>
            
            {/* 最终分数显示 */}
            <div className="w-full mb-3">
              <div className="flex items-center justify-center gap-1 mb-1.5">
                <span className="text-xs animate-wiggle">🎯</span>
                <p className="text-yellow-200 text-[10px] font-semibold">{t.gameOver.finalScore}</p>
                <span className="text-xs animate-wiggle" style={{ animationDelay: '0.2s' }}>🎯</span>
              </div>
              <div className="bg-gradient-to-r from-yellow-500/30 via-orange-500/30 to-pink-500/30 border-2 border-yellow-400/40 rounded-xl p-3 backdrop-blur-sm w-full">
                <div className="text-3xl sm:text-4xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-300 to-pink-300">
                  {score.toLocaleString()}
                </div>
                <p className="text-yellow-200/80 text-[9px] mt-1.5 text-center">{t.gameOver.encouragement}</p>
              </div>
            </div>
            
            {/* 按钮 */}
            <button 
              onClick={onRestart}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 hover:from-yellow-500 hover:via-orange-600 hover:to-pink-600 text-white font-bold text-sm rounded-xl transition-all active:scale-95 shadow-md transform hover:scale-105 relative overflow-hidden group"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <span className="text-sm animate-bounce inline-block">🔄</span>
                <span>{t.gameOver.playAgain}</span>
                <span className="text-sm animate-bounce inline-block" style={{ animationDelay: '0.1s' }}>✨</span>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            </button>
          </div>
        ) : (
          // 电脑端/竖屏布局：保持原有样式
          <div className={`flex flex-col items-center ${maxWidthClass} w-full bg-gradient-to-br from-yellow-50/10 via-orange-50/10 to-pink-50/10 border-2 border-yellow-300/30 p-6 sm:p-8 rounded-3xl shadow-2xl backdrop-blur-xl relative overflow-hidden my-4`}>
            {/* 装饰性背景元素 */}
            <div className="absolute top-4 left-4 text-xl sm:text-2xl animate-sparkle">⏰</div>
            <div className="absolute top-6 right-6 text-lg sm:text-xl animate-float">🎉</div>
            <div className="absolute bottom-6 left-6 text-lg sm:text-xl animate-wiggle">💛</div>
            <div className="absolute bottom-8 right-4 text-xl sm:text-2xl animate-sparkle">⭐</div>
            
            {/* 主内容 */}
            <div className="relative z-10 flex flex-col items-center w-full">
              {/* 可爱的emoji */}
              <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
                <div className="text-4xl sm:text-5xl animate-float" style={{ animationDelay: '0s' }}>🐰</div>
                <div className="text-5xl sm:text-6xl animate-float" style={{ animationDelay: '0.2s' }}>⏰</div>
                <div className="text-4xl sm:text-5xl animate-float" style={{ animationDelay: '0.4s' }}>🐰</div>
              </div>
              
              <h1 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 mb-2 animate-pulse px-2 text-center">
                {t.gameOver.timeUp}
              </h1>
              <div className="flex items-center gap-1 mb-3 sm:mb-4">
                <span className="text-base sm:text-lg animate-wiggle">🎯</span>
                <p className="text-yellow-200 text-xs sm:text-sm font-semibold">{t.gameOver.finalScore}</p>
                <span className="text-base sm:text-lg animate-wiggle" style={{ animationDelay: '0.2s' }}>🎯</span>
              </div>
              
              {/* 分数显示 */}
              <div className="bg-gradient-to-r from-yellow-500/30 via-orange-500/30 to-pink-500/30 border-2 border-yellow-400/40 rounded-2xl p-4 sm:p-6 mb-4 sm:mb-5 md:mb-6 backdrop-blur-sm w-full">
                <div className="text-5xl sm:text-6xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-300 to-pink-300">
                  {score.toLocaleString()}
                </div>
                <p className="text-yellow-200/80 text-[10px] sm:text-xs mt-2 text-center">{t.gameOver.encouragement}</p>
              </div>
            </div>
            
            <div className="w-full space-y-2 sm:space-y-3 relative z-10">
              <button 
                onClick={onRestart}
                className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 hover:from-yellow-500 hover:via-orange-600 hover:to-pink-600 text-white font-bold text-sm sm:text-base rounded-xl transition-all active:scale-95 shadow-md transform hover:scale-105 relative overflow-hidden group"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <span className="text-sm sm:text-base animate-bounce inline-block">🔄</span>
                  <span className="whitespace-nowrap">{t.gameOver.playAgain}</span>
                  <span className="text-sm sm:text-base animate-bounce inline-block" style={{ animationDelay: '0.1s' }}>✨</span>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </button>
            </div>
          </div>
        )
      )}

      {state === 'noMoves' && (
        isMobileLandscape ? (
          // 移动端横屏布局：垂直布局但更紧凑，可滚动
          <div className={`flex flex-col items-center w-full max-w-lg bg-gradient-to-br from-pink-50/10 via-purple-50/10 to-blue-50/10 border-2 border-pink-300/30 p-4 pb-6 rounded-2xl shadow-2xl backdrop-blur-xl relative overflow-y-auto max-h-[85vh] my-2`}>
            {/* 装饰性背景元素 - 减少数量 */}
            <div className="absolute top-2 left-2 text-base animate-sparkle">🌸</div>
            <div className="absolute top-2 right-3 text-base animate-float">💐</div>
            
            {/* 图标和标题 */}
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <div className="text-2xl animate-float" style={{ animationDelay: '0s' }}>🐰</div>
              <div className="text-3xl animate-float" style={{ animationDelay: '0.2s' }}>🌸</div>
              <div className="text-2xl animate-float" style={{ animationDelay: '0.4s' }}>🐰</div>
            </div>
            
            <h1 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-500 to-blue-400 mb-2 animate-pulse text-center">
              {t.noMoves.title}
            </h1>
            
            {/* 最终分数显示 */}
            <div className="w-full mb-3">
              <div className="flex items-center justify-center gap-1 mb-1.5">
                <span className="text-xs animate-wiggle">💔</span>
                <p className="text-pink-200 text-[10px] font-semibold">{t.noMoves.gameOver}</p>
                <span className="text-xs animate-wiggle" style={{ animationDelay: '0.2s' }}>💔</span>
              </div>
              <div className="bg-gradient-to-r from-pink-500/30 via-purple-500/30 to-blue-500/30 border-2 border-pink-400/40 rounded-xl p-3 backdrop-blur-sm w-full">
                <div className="text-3xl sm:text-4xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-purple-300 to-blue-300">
                  {score.toLocaleString()}
                </div>
                <p className="text-pink-200/80 text-[9px] mt-1.5 text-center">{t.noMoves.encouragement}</p>
              </div>
            </div>
            
            {/* 按钮 */}
            <button 
              onClick={onRestart}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-pink-400 via-purple-500 to-blue-500 hover:from-pink-500 hover:via-purple-600 hover:to-blue-600 text-white font-bold text-sm rounded-xl transition-all active:scale-95 shadow-md transform hover:scale-105 relative overflow-hidden group"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <span className="text-sm animate-bounce inline-block">🔄</span>
                <span>{t.noMoves.playAgain}</span>
                <span className="text-sm animate-bounce inline-block" style={{ animationDelay: '0.1s' }}>✨</span>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            </button>
          </div>
        ) : (
          // 电脑端/竖屏布局：保持原有样式
          <div className={`flex flex-col items-center ${maxWidthClass} w-full bg-gradient-to-br from-pink-50/10 via-purple-50/10 to-blue-50/10 border-2 border-pink-300/30 p-6 sm:p-8 rounded-3xl shadow-2xl backdrop-blur-xl relative overflow-hidden my-4`}>
            {/* 装饰性背景元素 */}
            <div className="absolute top-4 left-4 text-xl sm:text-2xl animate-sparkle">🌸</div>
            <div className="absolute top-6 right-6 text-lg sm:text-xl animate-float">💐</div>
            <div className="absolute bottom-6 left-6 text-lg sm:text-xl animate-wiggle">🌺</div>
            <div className="absolute bottom-8 right-4 text-xl sm:text-2xl animate-sparkle">🌼</div>
            
            {/* 主内容 */}
            <div className="relative z-10 flex flex-col items-center w-full">
              {/* 可爱的emoji */}
              <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
                <div className="text-4xl sm:text-5xl animate-float" style={{ animationDelay: '0s' }}>🐰</div>
                <div className="text-5xl sm:text-6xl animate-float" style={{ animationDelay: '0.2s' }}>🌸</div>
                <div className="text-4xl sm:text-5xl animate-float" style={{ animationDelay: '0.4s' }}>🐰</div>
              </div>
              
              <h1 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-500 to-blue-400 mb-2 animate-pulse px-2 text-center">
                {t.noMoves.title}
              </h1>
              <div className="flex items-center gap-1 mb-3 sm:mb-4">
                <span className="text-base sm:text-lg animate-wiggle">💔</span>
                <p className="text-pink-200 text-xs sm:text-sm font-semibold">{t.noMoves.gameOver}</p>
                <span className="text-base sm:text-lg animate-wiggle" style={{ animationDelay: '0.2s' }}>💔</span>
              </div>
              
              {/* 可爱的提示文字 */}
              <div className="bg-pink-500/20 border border-pink-400/30 rounded-2xl p-3 mb-3 sm:mb-4 backdrop-blur-sm w-full">
                <p className="text-pink-100 text-[10px] sm:text-xs text-center whitespace-pre-line leading-relaxed">
                  {t.noMoves.message}
                </p>
              </div>
              
              {/* 分数显示 */}
              <div className="bg-gradient-to-r from-pink-500/30 via-purple-500/30 to-blue-500/30 border-2 border-pink-400/40 rounded-2xl p-4 sm:p-6 mb-4 sm:mb-5 md:mb-6 backdrop-blur-sm w-full">
                <div className="text-5xl sm:text-6xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-purple-300 to-blue-300">
                  {score.toLocaleString()}
                </div>
                <p className="text-pink-200/80 text-[10px] sm:text-xs mt-2 text-center">{t.noMoves.encouragement}</p>
              </div>
            </div>
            
            <div className="w-full space-y-2 sm:space-y-3 relative z-10">
              <button 
                onClick={onRestart}
                className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-pink-400 via-purple-500 to-blue-500 hover:from-pink-500 hover:via-purple-600 hover:to-blue-600 text-white font-bold text-sm sm:text-base rounded-xl transition-all active:scale-95 shadow-md transform hover:scale-105 relative overflow-hidden group"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <span className="text-sm sm:text-base animate-bounce inline-block">🔄</span>
                  <span className="whitespace-nowrap">{t.noMoves.playAgain}</span>
                  <span className="text-sm sm:text-base animate-bounce inline-block" style={{ animationDelay: '0.1s' }}>✨</span>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </button>
            </div>
          </div>
        )
      )}
    </div>
  );
};

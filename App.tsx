
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameBoard } from './components/GameBoard';
import { UIOverlay } from './components/UIOverlay';
import { LandscapePrompt } from './components/LandscapePrompt';
import { LevelPrompt } from './components/LevelPrompt';
import { AdsManager } from './services/AdsManager';
import { AudioManager } from './services/AudioManager';
import { Difficulty, LevelConfig, getLevelByScore } from './constants';
import { useTranslation } from './i18n/useTranslation';
import { getAssetPath } from './utils/paths';
import { requestFullscreen, lockOrientation } from './utils/fullscreen';

const App: React.FC = () => {
  const { t } = useTranslation();
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [gameState, setGameState] = useState<'start' | 'loading' | 'playing' | 'gameover' | 'noMoves'>('start');
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  
  // 时间更新回调
  const handleTimeUpdate = useCallback((time: number | null) => {
    // 调试：输出时间更新
    if (time !== null) {
      console.log(`[App] Time updated: ${time}`);
    }
    // 直接更新，React 会自动处理相同值的优化
    setTimeRemaining(time);
  }, []);
  const [isPaused, setIsPaused] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(1); // 当前关卡编号
  const [levelPromptConfig, setLevelPromptConfig] = useState<LevelConfig | null>(null); // 关卡提示配置
  const [isAssetsLoaded, setIsAssetsLoaded] = useState(false); // 资源是否已加载完成
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const adsManager = useRef(new AdsManager());
  const audioManager = useRef(new AudioManager());

  // 初始化平台适配器
  useEffect(() => {
    adsManager.current.init().then(() => {
      console.log(`[Platform] Initialized: ${adsManager.current.getPlatform()}`);
    });
  }, []);

  // 从 localStorage 读取设置
  useEffect(() => {
    const savedMusic = localStorage.getItem('game-music-enabled');
    const savedSound = localStorage.getItem('game-sound-enabled');
    
    if (savedMusic !== null) {
      const enabled = savedMusic === 'true';
      setMusicEnabled(enabled);
      audioManager.current.setMusicEnabled(enabled);
    }
    
    if (savedSound !== null) {
      const enabled = savedSound === 'true';
      setSoundEnabled(enabled);
      audioManager.current.setEnabled(enabled);
    }
  }, []);

  const handleScoreUpdate = useCallback((newScore: number, currentCombo: number) => {
    setScore(prev => prev + newScore);
    setCombo(currentCombo);
  }, []);

  const handleGameOver = useCallback(() => {
    setGameState('gameover');
    // 通知平台游戏停止
    adsManager.current.gameplayStop();
    // 暂停背景音乐
    audioManager.current.pauseBackgroundMusic();
    // 播放风声音效
    audioManager.current.playWindSound(0.6).catch(() => {
      // 如果播放失败，静默处理
    });
    adsManager.current.showInterstitialAd();
  }, []);

  const handleNoMoves = useCallback(() => {
    setGameState('noMoves');
    // 通知平台游戏停止
    adsManager.current.gameplayStop();
    // 暂停背景音乐
    audioManager.current.pauseBackgroundMusic();
    // 播放风声音效
    audioManager.current.playWindSound(0.6).catch(() => {
      // 如果播放失败，静默处理
    });
    adsManager.current.showInterstitialAd();
  }, []);

  const handleTimeUp = useCallback(() => {
    setGameState('gameover');
    // 通知平台游戏停止
    adsManager.current.gameplayStop();
    // 暂停背景音乐
    audioManager.current.pauseBackgroundMusic();
    // 播放风声音效
    audioManager.current.playWindSound(0.6).catch(() => {
      // 如果播放失败，静默处理
    });
    adsManager.current.showInterstitialAd();
  }, []);

  const handleStart = useCallback(async (selectedDifficulty?: Difficulty) => {
    const finalDifficulty = selectedDifficulty || difficulty;
    if (selectedDifficulty) {
      setDifficulty(selectedDifficulty);
    }
    // 初始化timeRemaining为第一关的时间限制，让血条一开始就显示
    const firstLevelConfig = getLevelByScore(0, finalDifficulty);
    setTimeRemaining(firstLevelConfig.timeLimit);
    setCurrentLevel(1); // 重置关卡
    setLevelPromptConfig(null); // 清除之前的提示
    setGameState('loading');
    await adsManager.current.showLoadingAd();
    
    // 通知平台游戏开始
    adsManager.current.gameplayStart();
    
    // 移动端：尝试进入全屏并锁定横屏
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                     (window.matchMedia && window.matchMedia('(max-width: 768px)').matches);
    
    if (isMobile) {
      try {
        // 先锁定横屏方向
        await lockOrientation('landscape');
        // 然后进入全屏（隐藏地址栏）
        await requestFullscreen();
      } catch (e) {
        console.log('Fullscreen/orientation setup failed:', e);
        // 如果失败，继续游戏
      }
    }
    
    // 开始播放背景音乐
    const baseUrl = import.meta.env.BASE_URL || '/';
    const musicFiles = [
      `${baseUrl}sounds/background-music.wav`,
      `${baseUrl}sounds/bgm.wav`,
      `${baseUrl}sounds/music.wav`
    ];
    
    for (const file of musicFiles) {
      try {
        await audioManager.current.playBackgroundMusic(file, 0.2);
        break; // 如果成功播放，就停止尝试其他文件
      } catch (e) {
        // 继续尝试下一个文件
      }
    }
    
    setGameState('playing');
    setIsAssetsLoaded(false); // 重置资源加载状态
  }, [difficulty]);

  // 资源加载完成回调
  const handleAssetsLoaded = useCallback(() => {
    console.log('[App] 资源加载完成');
    setIsAssetsLoaded(true);
    
    // 所有难度下，资源加载完成后显示第一关提示
    const firstLevelConfig = getLevelByScore(0, difficulty);
    console.log(`[App] 资源加载完成，显示第一关提示: 关卡 ${firstLevelConfig.level}, difficulty=${difficulty}`);
    // 稍微延迟，确保游戏界面已完全渲染
    setTimeout(() => {
      console.log(`[App] 设置第一关提示配置`);
      setLevelPromptConfig(firstLevelConfig);
    }, 300);
  }, [difficulty]);

  const handleRestart = () => {
    setScore(0);
    setCombo(0);
    // 初始化timeRemaining为第一关的时间限制，让血条一开始就显示
    const firstLevelConfig = getLevelByScore(0, difficulty);
    setTimeRemaining(firstLevelConfig.timeLimit);
    setCurrentLevel(1); // 重置关卡
    setLevelPromptConfig(null); // 清除之前的提示
    setIsAssetsLoaded(false); // 重置资源加载状态
    // 恢复背景音乐
    audioManager.current.resumeBackgroundMusic();
    setGameState('playing');
    // 注意：关卡提示会在 handleAssetsLoaded 中显示，如果资源已经加载过，
    // GameBoard 的 useEffect 可能不会再次执行，所以我们需要确保资源加载状态正确
  };

  // 关卡切换回调
  const handleLevelChange = useCallback((oldLevel: number, newLevel: number, levelConfig: LevelConfig) => {
    setCurrentLevel(newLevel);
    console.log(`[Level] 关卡切换: ${oldLevel} -> ${newLevel}, 时间限制: ${levelConfig.timeLimit}秒, 当前难度: ${difficulty}`);
    
    // 所有难度下显示关卡提示
    if (oldLevel !== newLevel) {
      console.log(`[Level] 显示关卡提示: 关卡 ${newLevel}`);
      setLevelPromptConfig(levelConfig);
    } else {
      console.log(`[Level] 不显示关卡提示: difficulty=${difficulty}, oldLevel=${oldLevel}, newLevel=${newLevel}`);
    }
  }, [difficulty]);
  
  // 关闭关卡提示
  const handleCloseLevelPrompt = useCallback(() => {
    setLevelPromptConfig(null);
  }, []);

  const handleRequestReward = async () => {
    const success = await adsManager.current.showRewardedAd();
    if (success) {
      alert("Reward granted! (Implementation Placeholder)");
    }
  };

  // 设置相关处理函数
  const handleMusicToggle = useCallback(() => {
    const newValue = !musicEnabled;
    setMusicEnabled(newValue);
    audioManager.current.setMusicEnabled(newValue);
    localStorage.setItem('game-music-enabled', String(newValue));
  }, [musicEnabled]);

  const handleSoundToggle = useCallback(() => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    audioManager.current.setEnabled(newValue);
    localStorage.setItem('game-sound-enabled', String(newValue));
  }, [soundEnabled]);

  const handlePause = useCallback(() => {
    setIsPaused(true);
    audioManager.current.pauseBackgroundMusic();
  }, []);

  const handleResume = useCallback(() => {
    setIsPaused(false);
    audioManager.current.resumeBackgroundMusic();
  }, []);

  const handlePauseToggle = useCallback(() => {
    if (isPaused) {
      handleResume();
    } else {
      handlePause();
    }
  }, [isPaused, handlePause, handleResume]);

  // 开发模式：快捷键测试无解法界面（连按三下P键，PC端）
  useEffect(() => {
    let pKeyPresses: number[] = []; // 记录P键按下时间戳
    const PRESS_TIME_WINDOW = 800; // 800ms内连续按三下
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // 仅在游戏进行中时监听
      if (gameState !== 'playing') return;
      
      // 检测P键
      if (e.key.toLowerCase() === 'p') {
        const now = Date.now();
        
        // 清除超时的按键记录
        pKeyPresses = pKeyPresses.filter(timestamp => now - timestamp < PRESS_TIME_WINDOW);
        
        // 添加当前按键时间戳
        pKeyPresses.push(now);
        
        // 如果连续按了三下（在时间窗口内）
        if (pKeyPresses.length >= 3) {
          e.preventDefault();
          console.log('[Dev] Triggering noMoves test (triple P press)');
          handleNoMoves();
          pKeyPresses = []; // 重置计数器
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameState, handleNoMoves]);

  // 判断是否为游戏进行中（需要横屏）
  const isGamePlaying = gameState === 'playing' || gameState === 'loading';
  
  // 检测是否为横屏（用于显示关卡提示）
  const [isLandscape, setIsLandscape] = useState(false);
  
  // 检测横屏/竖屏
  useEffect(() => {
    const checkOrientation = () => {
      const isLandscapeMode = window.innerWidth > window.innerHeight;
      setIsLandscape(isLandscapeMode);
    };
    
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);
  
  return (
    <div 
      className={`relative w-screen h-screen flex items-center justify-center overflow-hidden text-white select-none ${
        isGamePlaying ? 'landscape-mode' : 'portrait-mode'
      }`}
    >
      {/* 背景图片 */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${getAssetPath('background.jpg')}), url(${getAssetPath('background.png')})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          // 确保背景图在电脑上正确显示，2730*1319分辨率适配
          minHeight: '100vh',
          minWidth: '100vw',
          // 保持背景图比例，避免拉伸
          backgroundAttachment: 'fixed'
        }}
      >
        {/* 背景遮罩层，确保内容可读性（更透明以显示背景图） */}
        <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[0.5px]"></div>
      </div>

      {/* 横屏提示（游戏进行中且移动端竖屏时显示） */}
      <LandscapePrompt gameState={gameState} />
      
      {/* 关卡提示（在所有难度下且横屏时显示） */}
      {gameState === 'playing' && isLandscape && (
        <LevelPrompt 
          levelConfig={levelPromptConfig} 
          onClose={handleCloseLevelPrompt}
        />
      )}


      <div className={`main-game-container relative z-10 w-full h-full flex ${isGamePlaying ? 'flex-row' : 'flex-col'} p-1 sm:p-2 md:p-4 box-border gap-2 sm:gap-3 md:gap-4 ${
        isGamePlaying ? 'max-w-5xl mx-auto' : 'max-w-md mx-auto'
      }`}>
        {/* 游戏区域 */}
        <div className="relative flex-grow bg-transparent rounded-xl sm:rounded-2xl overflow-hidden min-h-0">
          {gameState === 'playing' && (
            <GameBoard 
              onScoreUpdate={handleScoreUpdate} 
              onGameOver={handleGameOver}
              onNoMoves={handleNoMoves}
              onTimeUp={handleTimeUp}
              onTimeUpdate={handleTimeUpdate}
              onLevelChange={handleLevelChange}
              onAssetsLoaded={handleAssetsLoaded}
              audioManager={audioManager.current}
              currentScore={score}
              difficulty={difficulty}
              isPaused={isPaused}
            />
          )}
          
          <UIOverlay 
            state={gameState} 
            score={score}
            onStart={handleStart}
            onRestart={handleRestart}
            onRewardedAd={handleRequestReward}
            currentDifficulty={difficulty}
          />
        </div>

        {/* 右侧UI信息栏 - 只在游戏进行时显示 */}
        {gameState !== 'start' && isGamePlaying && (
          <div className="flex flex-col items-end gap-2 sm:gap-3 md:gap-4 lg:gap-5 min-w-[100px] sm:min-w-[120px] md:min-w-[140px] lg:min-w-[160px]">
            {/* 第一排：得分 */}
            <div className="flex flex-col items-end min-w-0">
              <span className="text-[9px] sm:text-[10px] md:text-xs cute-label text-pink-300 uppercase tracking-widest drop-shadow-lg">{t.game.score}</span>
              <span className="text-lg sm:text-xl md:text-2xl lg:text-3xl cute-number text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] truncate" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 10px rgba(255,182,193,0.3)' }}>
                {score.toLocaleString()}
              </span>
            </div>
            
            {/* 第二排：连击 */}
            <div className="flex flex-col items-end min-w-0">
              <span className="text-[9px] sm:text-[10px] md:text-xs cute-label text-yellow-300 uppercase tracking-widest drop-shadow-lg">{t.game.combo}</span>
              <span 
                className={`text-lg sm:text-xl md:text-2xl lg:text-3xl cute-number transition-all drop-shadow-[0_3px_6px_rgba(0,0,0,0.9)] ${
                  combo > 1 
                    ? 'text-yellow-300 scale-110' 
                    : 'text-yellow-400/70'
                }`}
                style={{ 
                  textShadow: combo > 1 
                    ? '3px 3px 6px rgba(0,0,0,0.9), 0 0 15px rgba(255,215,0,0.6), 0 0 25px rgba(255,215,0,0.4)' 
                    : '2px 2px 4px rgba(0,0,0,0.8), 0 0 10px rgba(255,215,0,0.3)'
                }}
              >
                x{combo}
              </span>
            </div>
            
            {/* 第三排：关卡+血条 */}
            {timeRemaining !== null ? (() => {
              const levelConfig = getLevelByScore(score, difficulty);
              const timeLimit = levelConfig.timeLimit;
              // 确保 timeRemaining 和 timeLimit 都是有效数字
              const percentage = timeLimit > 0 ? Math.max(0, Math.min(100, (timeRemaining / timeLimit) * 100)) : 0;
              return (
                <div className="flex flex-col items-end w-full gap-1 sm:gap-1.5 md:gap-2">
                  {/* 关卡显示 */}
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <span className="text-[8px] sm:text-[9px] md:text-[10px] cute-label text-purple-300 uppercase tracking-wider drop-shadow-lg">
                      {t.game.level || 'Level'}
                    </span>
                    <span className="text-sm sm:text-base md:text-lg lg:text-xl cute-number text-purple-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-bold">
                      {currentLevel === 4 ? (t.levelPrompt?.finalLevel || '最终关卡') : currentLevel}
                    </span>
                  </div>
                  {/* 血条容器 */}
                  <div className="w-full h-3 sm:h-4 md:h-5 lg:h-6 bg-slate-700/80 rounded-full border border-slate-600 shadow-lg overflow-hidden backdrop-blur-sm">
                    {/* 血条填充 */}
                    <div 
                      className={`h-full transition-all duration-300 ease-linear rounded-full ${
                        timeRemaining <= timeLimit * 0.2 ? 'bg-gradient-to-r from-red-600 to-red-500 animate-pulse' : 
                        timeRemaining <= timeLimit * 0.5 ? 'bg-gradient-to-r from-orange-500 to-orange-400' : 
                        'bg-gradient-to-r from-green-500 to-green-400'
                      }`}
                      style={{ 
                        width: `${percentage}%`,
                        transition: 'width 0.3s linear'
                      }}
                    >
                      {/* 血条内部光效 */}
                      <div className="h-full w-full bg-gradient-to-t from-transparent via-white/20 to-transparent"></div>
                    </div>
                  </div>
                </div>
              );
            })() : null}

            {/* 设置按钮区域 - 放在血条下方 */}
            <div className="flex flex-col items-end gap-1.5 sm:gap-2 md:gap-2.5 w-full">
              {/* 第一排：音乐按钮 */}
              <button
                onClick={handleMusicToggle}
                className={`flex items-center justify-end gap-1.5 sm:gap-2 px-2 sm:px-2.5 md:px-3 py-1.5 sm:py-2 rounded-lg transition-all w-full text-[10px] sm:text-xs md:text-sm ${
                  musicEnabled
                    ? 'bg-green-500/20 hover:bg-green-500/30 active:bg-green-500/40 text-green-400 border border-green-500/50'
                    : 'bg-slate-700/50 hover:bg-slate-700/70 active:bg-slate-700/80 text-slate-400 border border-slate-600/50'
                }`}
                title={musicEnabled ? t.settings?.musicOn || '音乐: 开' : t.settings?.musicOff || '音乐: 关'}
              >
                <span className="text-sm sm:text-base md:text-lg">
                  {musicEnabled ? '🎵' : '🔇'}
                </span>
                <span className="text-[9px] sm:text-[10px] md:text-xs font-semibold">
                  {t.settings?.music || '音乐'}
                </span>
              </button>

              {/* 第二排：音效按钮 */}
              <button
                onClick={handleSoundToggle}
                className={`flex items-center justify-end gap-1.5 sm:gap-2 px-2 sm:px-2.5 md:px-3 py-1.5 sm:py-2 rounded-lg transition-all w-full text-[10px] sm:text-xs md:text-sm ${
                  soundEnabled
                    ? 'bg-blue-500/20 hover:bg-blue-500/30 active:bg-blue-500/40 text-blue-400 border border-blue-500/50'
                    : 'bg-slate-700/50 hover:bg-slate-700/70 active:bg-slate-700/80 text-slate-400 border border-slate-600/50'
                }`}
                title={soundEnabled ? t.settings?.soundOn || '音效: 开' : t.settings?.soundOff || '音效: 关'}
              >
                <span className="text-sm sm:text-base md:text-lg">
                  {soundEnabled ? '🔊' : '🔇'}
                </span>
                <span className="text-[9px] sm:text-[10px] md:text-xs font-semibold">
                  {t.settings?.sound || '音效'}
                </span>
              </button>

              {/* 第三排：暂停按钮 */}
              <button
                onClick={handlePauseToggle}
                className={`flex items-center justify-end gap-1.5 sm:gap-2 px-2 sm:px-2.5 md:px-3 py-1.5 sm:py-2 rounded-lg transition-all w-full text-[10px] sm:text-xs md:text-sm ${
                  isPaused
                    ? 'bg-yellow-500/20 hover:bg-yellow-500/30 active:bg-yellow-500/40 text-yellow-400 border border-yellow-500/50'
                    : 'bg-purple-500/20 hover:bg-purple-500/30 active:bg-purple-500/40 text-purple-400 border border-purple-500/50'
                }`}
                title={isPaused ? t.settings?.resume || '继续' : t.settings?.pause || '暂停'}
              >
                <span className="text-sm sm:text-base md:text-lg">
                  {isPaused ? '▶️' : '⏸️'}
                </span>
                <span className="text-[9px] sm:text-[10px] md:text-xs font-semibold">
                  {isPaused ? (t.settings?.resume || '继续') : (t.settings?.pause || '暂停')}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;

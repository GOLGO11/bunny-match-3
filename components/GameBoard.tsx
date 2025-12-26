
import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from '../services/GameEngine';
import { Renderer } from '../services/Renderer';
import { InputHandler } from '../services/InputHandler';
import { AudioManager } from '../services/AudioManager';
import * as Types from '../types';
import * as Constants from '../constants';
import { Difficulty } from '../constants';
import { useTranslation } from '../i18n/useTranslation';

interface GameBoardProps {
  onScoreUpdate: (score: number, combo: number) => void;
  onGameOver: () => void;
  onNoMoves: () => void;
  onTimeUp?: () => void;
  onTimeUpdate?: (time: number | null) => void;
  onLevelChange?: (oldLevel: number, newLevel: number, levelConfig: any) => void; // 关卡切换回调
  onAssetsLoaded?: () => void; // 资源加载完成回调
  audioManager?: AudioManager; // 音频管理器实例（从App传入，确保使用同一个实例）
  currentScore?: number; // 当前累计分数
  difficulty: Difficulty;
  isPaused?: boolean;
}

export const GameBoard: React.FC<GameBoardProps> = ({ onScoreUpdate, onGameOver, onNoMoves, onTimeUp, onTimeUpdate, onLevelChange, onAssetsLoaded, audioManager: externalAudioManager, currentScore = 0, difficulty, isPaused = false }) => {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const inputRef = useRef<InputHandler | null>(null);
  const audioManagerRef = useRef<AudioManager | null>(null);
  const dragFromRef = useRef<Types.Point | null>(null);
  const dragToRef = useRef<Types.Point | null>(null);
  const dragPixelPosRef = useRef<{ x: number; y: number } | null>(null);
  const [isAssetsLoaded, setIsAssetsLoaded] = useState(false);
  
  const scoreUpdateRef = useRef(onScoreUpdate);
  scoreUpdateRef.current = onScoreUpdate;
  const noMovesRef = useRef(onNoMoves);
  noMovesRef.current = onNoMoves;
  const timeUpRef = useRef(onTimeUp);
  timeUpRef.current = onTimeUp;
  const timeUpdateRef = useRef(onTimeUpdate);
  timeUpdateRef.current = onTimeUpdate;
  const levelChangeRef = useRef(onLevelChange);
  levelChangeRef.current = onLevelChange;
  const assetsLoadedRef = useRef(onAssetsLoaded);
  assetsLoadedRef.current = onAssetsLoaded;
  const currentScoreRef = useRef(currentScore);
  currentScoreRef.current = currentScore;
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const init = async () => {
      // 如果资源已经加载过，直接通知父组件（重新开始的情况）
      if (rendererRef.current && isAssetsLoaded) {
        if (assetsLoadedRef.current) {
          assetsLoadedRef.current();
        }
        return; // 不需要重新加载资源
      }
      
      // Create Renderer and load images first
      const renderer = new Renderer(ctx);
      rendererRef.current = renderer;
      await renderer.loadImages();
      setIsAssetsLoaded(true);
      // 通知父组件资源已加载完成
      if (assetsLoadedRef.current) {
        assetsLoadedRef.current();
      }

      // Initialize Audio Manager（优先使用外部传入的实例，确保与SettingsPanel使用同一个实例）
      if (externalAudioManager) {
        audioManagerRef.current = externalAudioManager;
      } else if (!audioManagerRef.current) {
        audioManagerRef.current = new AudioManager();
      }
      const audioManager = audioManagerRef.current;

      // Initialize Engine (每次难度改变时重新创建)
      if (!engineRef.current || engineRef.current.difficulty !== difficulty) {
        // 清理旧的引擎
        if (engineRef.current) {
          engineRef.current.destroy();
        }
        
        engineRef.current = new GameEngine(
          (s, c) => scoreUpdateRef.current(s, c),
          (matches) => {
            // 当消除发生时，创建樱花特效
            if (rendererRef.current) {
              rendererRef.current.createCherryBlossomEffect(matches);
            }
            // 播放消除音效（兔子叫声）
            if (audioManager) {
              audioManager.playMatchSound(matches.length).catch(() => {
                // 如果播放失败（可能是浏览器限制），静默处理
              });
            }
          },
          () => {
            // 当没有解法时，触发回调
            noMovesRef.current();
          },
          () => {
            // 当时间到时，触发回调
            if (timeUpRef.current) {
              timeUpRef.current();
            }
          },
          difficulty
        );
        
        // 设置关卡切换回调
        if (engineRef.current) {
          engineRef.current.levelChangeCallback = (oldLevel, newLevel, levelConfig) => {
            if (levelChangeRef.current) {
              levelChangeRef.current(oldLevel, newLevel, levelConfig);
            }
          };
        }
        
        // 初始化倒计时显示（初始为null，等待第一次交换）
        // 计时器在第一次交换后才启动，所以初始时不显示
        if (timeUpdateRef.current) {
          timeUpdateRef.current(null);
        }
      }
      const engine = engineRef.current;

      // 在用户第一次点击时初始化音频上下文（解决浏览器自动播放限制）
      const initAudioOnInteraction = () => {
        if (audioManager) {
          // 静默激活音频上下文，不播放音效
          audioManager.activateAudioContext();
          // 确保背景音乐开始播放（如果存在）
          audioManager.ensureBackgroundMusicPlaying().catch(() => {});
        }
        canvas.removeEventListener('mousedown', initAudioOnInteraction);
        canvas.removeEventListener('touchstart', initAudioOnInteraction);
      };
      canvas.addEventListener('mousedown', initAudioOnInteraction);
      canvas.addEventListener('touchstart', initAudioOnInteraction);

      // 拖拽开始
      const onDragStart = (x: number, y: number, pixelX: number, pixelY: number) => {
        if (engine.status !== Types.GameStatus.IDLE) return;
        dragFromRef.current = { x, y };
        dragToRef.current = null;
        dragPixelPosRef.current = { x: pixelX, y: pixelY };
      };

      // 拖拽移动
      const onDragMove = (from: Types.Point, to: Types.Point | null, pixelX?: number, pixelY?: number) => {
        if (engine.status !== Types.GameStatus.IDLE) return;
        dragToRef.current = to;
        if (pixelX !== undefined && pixelY !== undefined) {
          dragPixelPosRef.current = { x: pixelX, y: pixelY };
        }
      };

      // 拖拽结束
      const onDragEnd = (from: Types.Point, to: Types.Point | null) => {
        if (engine.status !== Types.GameStatus.IDLE) return;
        if (to) {
          // 如果拖拽到相邻位置，执行交换
          engine.swapGems(from, to);
        }
        dragFromRef.current = null;
        dragToRef.current = null;
        dragPixelPosRef.current = null;
      };

      const input = new InputHandler(canvas, onDragStart, onDragMove, onDragEnd);
      inputRef.current = input;

      const handleResize = () => {
        const parent = canvas.parentElement;
        if (!parent) return;
        
        // 横屏时优先使用宽度，竖屏时使用较小值
        const isLandscape = window.innerWidth > window.innerHeight;
        const padding = isLandscape ? 8 : 16; // 横屏时减少 padding
        const availableWidth = parent.clientWidth - padding * 2;
        const availableHeight = parent.clientHeight - padding * 2;
        
        // 横屏时：使用宽度的90%，但不超过高度的95%
        // 竖屏时：使用较小值
        const size = isLandscape 
          ? Math.min(availableWidth * 0.9, availableHeight * 0.95)
          : Math.min(availableWidth, availableHeight * 0.9);
        
        canvas.width = size;
        canvas.height = size;
        renderer.resize(size, size);
        input.setCellSize(size / Constants.GRID_SIZE);
      };

      window.addEventListener('resize', handleResize);
      handleResize();

      // 更新倒计时显示（所有难度）
      let lastTimerStarted = false;
      let lastReportedTime: number | null = null;
      let initialTimeReported = false;
      const updateTimer = () => {
        // 使用最新的引擎引用
        const currentEngine = engineRef.current;
        if (currentEngine) {
          const isStarted = currentEngine.isTimerStarted();
          const remaining = currentEngine.getTimeRemaining();
          
          // 如果计时器已启动，更新剩余时间
          // 即使时间到了（remaining === 0），也显示0，直到游戏状态改变
          if (isStarted) {
            // 每次都更新，确保 React 能检测到变化
            // 即使值相同，也更新一次，确保状态同步
            if (timeUpdateRef.current) {
              // 调试：输出时间变化
              if (lastReportedTime !== remaining) {
                console.log(`[GameBoard] Time changed: ${lastReportedTime} -> ${remaining}`);
              }
              timeUpdateRef.current(remaining);
            }
            lastReportedTime = remaining;
            lastTimerStarted = true;
            initialTimeReported = true;
          } else if (!initialTimeReported) {
            // 如果计时器未启动，但还没有报告过初始时间，则报告一次初始时间
            // 这样血条可以在游戏开始时立即显示
            if (timeUpdateRef.current) {
              timeUpdateRef.current(remaining);
              initialTimeReported = true;
              console.log(`[GameBoard] Initial time reported: ${remaining}`);
            }
          }
          // 注意：如果计时器未启动且已经报告过初始时间，不更新（保持上一次的值，这样血条不会消失）
        }
      };
      // 使用更频繁的更新间隔，确保能及时反映时间变化
      // 计时器每秒减少1，我们每100ms检查一次，确保能及时更新
      const timerUpdateInterval = setInterval(updateTimer, 100);
      // 立即执行一次，确保初始状态正确
      updateTimer();
      
      // 更新分数到引擎（用于关卡计算）
      const updateScoreToEngine = () => {
        if (engineRef.current) {
          engineRef.current.updateScore(currentScoreRef.current);
        }
      };
      updateScoreToEngine();
      const scoreUpdateInterval = setInterval(updateScoreToEngine, 100);

      let animationId: number;
      let lastTime = performance.now();
      const loop = (currentTime: number) => {
        // 如果暂停，只渲染当前状态，不更新逻辑
        if (isPausedRef.current) {
          renderer.clear();
          renderer.drawGrid();
          
          // 绘制所有兔子（暂停时保持当前状态）
          for (let y = 0; y < Constants.GRID_SIZE; y++) {
            for (let x = 0; x < Constants.GRID_SIZE; x++) {
              const gem = engine.grid[y][x];
              if (gem) {
                renderer.drawGem(gem, false);
              }
            }
          }
          
          renderer.drawParticles();
          animationId = requestAnimationFrame(loop);
          return;
        }
        
        const deltaTime = currentTime - lastTime;
        lastTime = currentTime;
        
        engine.updateAnimations();
        renderer.updateParticles(deltaTime);
        renderer.clear();
        renderer.drawGrid();
        
        const dragFrom = dragFromRef.current;
        const dragTo = dragToRef.current;
        const dragPixelPos = dragPixelPosRef.current;
        
        for (let y = 0; y < Constants.GRID_SIZE; y++) {
          for (let x = 0; x < Constants.GRID_SIZE; x++) {
            const gem = engine.grid[y][x];
            if (gem) {
              // 检查是否是拖拽起点（拖拽时隐藏原位置的兔子）
              const isDragFrom = dragFrom?.x === x && dragFrom?.y === y;
              const isDragTo = dragTo?.x === x && dragTo?.y === y;
              
              // 如果正在拖拽这个兔子，不绘制原位置（会在拖拽位置绘制）
              if (!isDragFrom || !dragPixelPos) {
                renderer.drawGem(gem, isDragTo);
              }
            }
          }
        }
        
        // 绘制正在拖拽的兔子（跟随鼠标）
        if (dragFrom && dragPixelPos) {
          const draggedGem = engine.grid[dragFrom.y][dragFrom.x];
          if (draggedGem) {
            renderer.drawDraggingGem(draggedGem, dragPixelPos.x, dragPixelPos.y);
          }
        }
        
        // 绘制拖拽起点和目标的选中框
        if (dragFrom && !dragPixelPos) {
          renderer.drawSelectionBox(dragFrom);
        }
        if (dragTo) {
          renderer.drawSelectionBox(dragTo);
        }
        
        renderer.drawParticles(); // 在最后绘制粒子，确保在最上层
        animationId = requestAnimationFrame(loop);
      };
      loop(performance.now());

      return () => {
        cancelAnimationFrame(animationId);
        if (timerUpdateInterval) {
          clearInterval(timerUpdateInterval);
        }
        if (scoreUpdateInterval) {
          clearInterval(scoreUpdateInterval);
        }
        if (engineRef.current) {
          engineRef.current.destroy();
        }
        window.removeEventListener('resize', handleResize);
        canvas.removeEventListener('mousedown', initAudioOnInteraction);
        canvas.removeEventListener('touchstart', initAudioOnInteraction);
        input.destroy();
      };
    };

    const cleanup = init();
    return () => {
       cleanup.then(unsub => unsub?.());
    };
  }, [difficulty]); // 移除 currentScore 依赖，避免重复创建 GameEngine

  // 监听暂停状态变化，控制计时器
  useEffect(() => {
    if (engineRef.current) {
      if (isPaused) {
        engineRef.current.pauseTimer();
      } else {
        engineRef.current.resumeTimer();
      }
    }
  }, [isPaused]);

  return (
    <div className="w-full h-full flex items-center justify-center p-1 sm:p-2 bg-transparent rounded-xl relative min-h-0">
      {!isAssetsLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-sm z-10 rounded-xl">
           <div className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mb-2"></div>
           <p className="text-sm text-slate-300">{t.game.loadingRabbits}</p>
        </div>
      )}
      <canvas ref={canvasRef} className={`rounded-lg shadow-2xl cursor-grab active:cursor-grabbing touch-none transition-opacity duration-500 ${isAssetsLoaded ? 'opacity-100' : 'opacity-0'}`} />
    </div>
  );
};



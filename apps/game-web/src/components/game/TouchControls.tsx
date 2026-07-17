import React, { useRef, useCallback, useEffect, useState } from 'react';

type SimpleTouch = { identifier: number; clientX: number; clientY: number };

interface TouchState {
  moveX: number;
  moveY: number;
  aiming: boolean;
  aimAngle: number;
  fire: boolean;
  jetpack: boolean;
}

const JOYSTICK_RADIUS = 50;
const JOYSTICK_KNOB = 22;

function dispatchKey(code: string, type: 'keydown' | 'keyup') {
  window.dispatchEvent(new KeyboardEvent(type, { code, bubbles: true }));
}

function dispatchMouseButton(button: 0, type: 'mousedown' | 'mouseup') {
  window.dispatchEvent(new MouseEvent(type, { button, bubbles: true, clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 }));
}

function dispatchMouseMove(x: number, y: number) {
  window.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: x, clientY: y }));
}

export const TouchControls: React.FC = () => {
  const leftStickRef = useRef<HTMLDivElement>(null);
  const rightAreaRef = useRef<HTMLDivElement>(null);
  const touchIds = useRef<{ move: number | null; aim: number | null }>({ move: null, aim: null });
  const moveState = useRef({ x: 0, y: 0 });
  const aimState = useRef({ x: 0, y: 0, startX: 0, startY: 0 });
  const [moveKnob, setMoveKnob] = useState({ x: 0, y: 0 });
  const [aimKnob, setAimKnob] = useState({ x: 0, y: 0, active: false });
  const activeKeys = useRef(new Set<string>());
  const fireInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastGrenadeTime = useRef(0);

  const handleKeyDown = useCallback((code: string) => {
    if (!activeKeys.current.has(code)) {
      activeKeys.current.add(code);
      dispatchKey(code, 'keydown');
    }
  }, []);

  const handleKeyUp = useCallback((code: string) => {
    activeKeys.current.delete(code);
    dispatchKey(code, 'keyup');
  }, []);

  const updateMovement = useCallback((dx: number, dy: number) => {
    const prevX = moveState.current.x;
    const prevY = moveState.current.y;

    const deadzone = 0.2;
    const nx = Math.abs(dx) < deadzone ? 0 : (dx > 0 ? 1 : -1);
    const ny = Math.abs(dy) < deadzone ? 0 : (dy > 0 ? 1 : -1);

    moveState.current = { x: nx, y: ny };

    if (nx !== prevX) {
      if (prevX < 0) handleKeyUp('KeyA');
      if (prevX > 0) handleKeyUp('KeyD');
      if (nx < 0) handleKeyDown('KeyA');
      if (nx > 0) handleKeyDown('KeyD');
    }

    if (ny !== prevY) {
      if (prevY < 0) handleKeyUp('KeyW');
      if (prevY > 0) handleKeyUp('KeyS');
      if (ny < 0) handleKeyDown('KeyW');
      if (ny > 0) handleKeyDown('KeyS');
    }
  }, [handleKeyDown, handleKeyUp]);

  const startFire = useCallback(() => {
    dispatchMouseButton(0, 'mousedown');
  }, []);

  const stopFire = useCallback(() => {
    dispatchMouseButton(0, 'mouseup');
  }, []);

  const handleLeftTouchStart = useCallback((touch: { identifier: number; clientX: number; clientY: number }) => {
    touchIds.current.move = touch.identifier;
    const rect = leftStickRef.current!.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (touch.clientX - cx) / JOYSTICK_RADIUS;
    const dy = (touch.clientY - cy) / JOYSTICK_RADIUS;
    const clamped = Math.min(1, Math.sqrt(dx * dx + dy * dy));
    const angle = Math.atan2(dy, dx);
    const kx = Math.cos(angle) * clamped * JOYSTICK_RADIUS;
    const ky = Math.sin(angle) * clamped * JOYSTICK_RADIUS;
    setMoveKnob({ x: kx, y: ky });
    updateMovement(dx, dy);
  }, [updateMovement]);

  const handleLeftTouchMove = useCallback((touch: SimpleTouch) => {
    if (touch.identifier !== touchIds.current.move) return;
    const rect = leftStickRef.current!.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (touch.clientX - cx) / JOYSTICK_RADIUS;
    const dy = (touch.clientY - cy) / JOYSTICK_RADIUS;
    const clamped = Math.min(1, Math.sqrt(dx * dx + dy * dy));
    const angle = Math.atan2(dy, dx);
    const kx = Math.cos(angle) * clamped * JOYSTICK_RADIUS;
    const ky = Math.sin(angle) * clamped * JOYSTICK_RADIUS;
    setMoveKnob({ x: kx, y: ky });
    updateMovement(dx, dy);
  }, [updateMovement]);

  const handleLeftTouchEnd = useCallback((touch: SimpleTouch) => {
    if (touch.identifier !== touchIds.current.move) return;
    touchIds.current.move = null;
    setMoveKnob({ x: 0, y: 0 });
    updateMovement(0, 0);
  }, [updateMovement]);

  const handleRightTouchStart = useCallback((touch: SimpleTouch) => {
    touchIds.current.aim = touch.identifier;
    const rect = rightAreaRef.current!.getBoundingClientRect();
    aimState.current.startX = touch.clientX;
    aimState.current.startY = touch.clientY;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = touch.clientX - cx;
    const dy = touch.clientY - cy;
    setAimKnob({ x: dx, y: dy, active: true });
    aimState.current.x = dx;
    aimState.current.y = dy;
    startFire();
  }, [startFire]);

  const handleRightTouchMove = useCallback((touch: SimpleTouch) => {
    if (touch.identifier !== touchIds.current.aim) return;
    const rect = rightAreaRef.current!.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = touch.clientX - cx;
    const dy = touch.clientY - cy;
    setAimKnob({ x: dx, y: dy, active: true });
    aimState.current.x = dx;
    aimState.current.y = dy;

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    dispatchMouseMove(centerX + dx * 3, centerY + dy * 3);
  }, []);

  const handleRightTouchEnd = useCallback((touch: SimpleTouch) => {
    if (touch.identifier !== touchIds.current.aim) return;
    touchIds.current.aim = null;
    setAimKnob({ x: 0, y: 0, active: false });
    stopFire();
  }, [stopFire]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    Array.from(e.changedTouches).forEach((touch) => {
      const screenW = window.innerWidth;
      const x = touch.clientX;

      if (x < screenW * 0.4 && !touchIds.current.move) {
        handleLeftTouchStart(touch);
      } else if (x > screenW * 0.35 && !touchIds.current.aim) {
        handleRightTouchStart(touch);
      }
    });
  }, [handleLeftTouchStart, handleRightTouchStart]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    Array.from(e.changedTouches).forEach((touch) => {
      if (touch.identifier === touchIds.current.move) {
        handleLeftTouchMove(touch);
      } else if (touch.identifier === touchIds.current.aim) {
        handleRightTouchMove(touch);
      }
    });
  }, [handleLeftTouchMove, handleRightTouchMove]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    Array.from(e.changedTouches).forEach((touch) => {
      if (touch.identifier === touchIds.current.move) {
        handleLeftTouchEnd(touch);
      } else if (touch.identifier === touchIds.current.aim) {
        handleRightTouchEnd(touch);
      }
    });
  }, [handleLeftTouchEnd, handleRightTouchEnd]);

  useEffect(() => {
    return () => {
      if (fireInterval.current) clearInterval(fireInterval.current);
      activeKeys.current.forEach((code) => dispatchKey(code, 'keyup'));
      activeKeys.current.clear();
    };
  }, []);

  return (
    <div
      className="absolute inset-0 z-20 pointer-events-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: 'none' }}
    >
      {/* Left joystick */}
      <div
        ref={leftStickRef}
        className="absolute"
        style={{
          left: 24,
          bottom: 24,
          width: JOYSTICK_RADIUS * 2 + 20,
          height: JOYSTICK_RADIUS * 2 + 20,
        }}
      >
        <div
          className="absolute rounded-full border-2 border-white/20 bg-white/5"
          style={{
            width: JOYSTICK_RADIUS * 2 + 20,
            height: JOYSTICK_RADIUS * 2 + 20,
            left: 0,
            top: 0,
          }}
        />
        <div
          className="absolute rounded-full bg-white/40 border border-white/50"
          style={{
            width: JOYSTICK_KNOB * 2,
            height: JOYSTICK_KNOB * 2,
            left: JOYSTICK_RADIUS + 10 - JOYSTICK_KNOB + moveKnob.x,
            top: JOYSTICK_RADIUS + 10 - JOYSTICK_KNOB + moveKnob.y,
            transition: 'left 0.05s, top 0.05s',
          }}
        />
        <div
          className="absolute text-white/30 text-xs font-bold select-none"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: 10,
          }}
        >
          MOVE
        </div>
      </div>

      {/* Right aim area */}
      <div
        ref={rightAreaRef}
        className="absolute"
        style={{
          right: 24,
          bottom: 24,
          width: JOYSTICK_RADIUS * 2 + 20,
          height: JOYSTICK_RADIUS * 2 + 20,
        }}
      >
        <div
          className="absolute rounded-full border-2 border-danger/30 bg-danger/5"
          style={{
            width: JOYSTICK_RADIUS * 2 + 20,
            height: JOYSTICK_RADIUS * 2 + 20,
          }}
        />
        {aimKnob.active && (
          <div
            className="absolute rounded-full bg-danger/50 border border-danger/70"
            style={{
              width: JOYSTICK_KNOB * 2,
              height: JOYSTICK_KNOB * 2,
              left: JOYSTICK_RADIUS + 10 - JOYSTICK_KNOB + aimKnob.x * 0.3,
              top: JOYSTICK_RADIUS + 10 - JOYSTICK_KNOB + aimKnob.y * 0.3,
            }}
          />
        )}
        <div
          className="absolute text-danger/40 text-xs font-bold select-none"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: 10,
          }}
        >
          FIRE
        </div>
      </div>

      {/* Jetpack button - bottom center */}
      <button
        className="absolute rounded-full border-2 border-primary/40 bg-primary/10 flex items-center justify-center"
        style={{
          left: '50%',
          bottom: 24,
          transform: 'translateX(-50%)',
          width: 64,
          height: 64,
        }}
        onTouchStart={(e) => {
          e.stopPropagation();
          handleKeyDown('Space');
        }}
        onTouchEnd={(e) => {
          e.stopPropagation();
          handleKeyUp('Space');
        }}
      >
        <span className="text-primary/60 text-xs font-bold select-none">JET</span>
      </button>

      {/* Grenade button */}
      <button
        className="absolute rounded-full border-2 border-secondary/40 bg-secondary/10 flex items-center justify-center"
        style={{
          left: '50%',
          bottom: 100,
          transform: 'translateX(-50%)',
          width: 48,
          height: 48,
        }}
        onTouchStart={(e) => {
          e.stopPropagation();
          const now = Date.now();
          if (now - lastGrenadeTime.current > 500) {
            lastGrenadeTime.current = now;
            handleKeyDown('KeyG');
            setTimeout(() => handleKeyUp('KeyG'), 100);
          }
        }}
      >
        <span className="text-secondary/60 text-xs font-bold select-none">G</span>
      </button>
    </div>
  );
};

export default TouchControls;

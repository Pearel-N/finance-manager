"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface CircularProgressProps {
  value: number // 0-100+ (can exceed 100 for overspent)
  remaining?: number // 0-100 (remaining percentage)
  size?: number
  strokeWidth?: number
  className?: string
  // Change this to replay the animation even when the numbers are the
  // same, for example on every refetch.
  animationKey?: string | number
}

const DEFAULT_SIZE = 120;
const DEFAULT_STROKE_WIDTH = 8;
const PATH_COUNTER_ROTATION = 90; // degrees to counteract SVG rotation
const TOP_ANGLE = -Math.PI / 2; // -90deg = top in standard coords
const FULL_CIRCLE_RADIANS = 2 * Math.PI;
const HALF_CIRCLE_RADIANS = Math.PI;
const ANIMATION_MS = 700;

/**
 * Counts from `from` to `target` over ANIMATION_MS, redrawing each frame.
 *
 * The ring is an SVG arc, and its `d` attribute cannot be transitioned by
 * CSS the way a width or an opacity can. So instead of animating the
 * drawing, we animate the number and let the arc be recalculated on every
 * frame.
 *
 * Restarts whenever the target or `replayKey` changes, so a refetch
 * replays the sweep even when the value is unchanged.
 */
function useAnimatedValue(target: number, from: number, replayKey?: string | number): number {
  const [current, setCurrent] = React.useState(target);

  React.useEffect(() => {
    // Someone who has asked their system for less motion gets the final
    // value straight away.
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      setCurrent(target);
      return;
    }

    let frame = 0;
    const startedAt = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / ANIMATION_MS);
      // Ease out: quick at first, settling gently at the end.
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(from + (target - from) * eased);

      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, from, replayKey]);

  return current;
}

/**
 * Calculate SVG arc path for circular progress
 */
function createArcPath(
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number,
  sweepFlag: number // 0 = counter-clockwise, 1 = clockwise
): string {
  const startX = centerX + radius * Math.cos(startAngle);
  const startY = centerY + radius * Math.sin(startAngle);
  const endX = centerX + radius * Math.cos(endAngle);
  const endY = centerY + radius * Math.sin(endAngle);
  
  const angleDiff = Math.abs(endAngle - startAngle);
  const largeArcFlag = angleDiff > HALF_CIRCLE_RADIANS ? 1 : 0;
  
  return `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${endX} ${endY}`;
}

export const CircularProgress = React.forwardRef<
  SVGSVGElement,
  CircularProgressProps
>(({ value, remaining = 0, size = DEFAULT_SIZE, strokeWidth = DEFAULT_STROKE_WIDTH, className, animationKey, ...props }, ref) => {
  // Both rings sweep out from "a full day's budget, nothing spent":
  // the dark ring shrinks from 100% down to what is left, and the red
  // one grows from zero (value 100 means spent exactly the budget).
  const overspentTarget = value > 100;
  const animatedRemaining = useAnimatedValue(overspentTarget ? 0 : remaining, 100, animationKey);
  const animatedValue = useAnimatedValue(value, 100, animationKey);

  const radius = (size - strokeWidth) / 2;
  const centerX = size / 2;
  const centerY = size / 2;
  
  const isOverspent = animatedValue > 100;
  const excessPercentage = isOverspent ? animatedValue - 100 : 0;
  const excessProgress = Math.min(100, excessPercentage);
  
  // Calculate arc paths
  const remainingPath = React.useMemo(() => {
    if (isOverspent || animatedRemaining <= 0) return '';
    
    const remainingAngle = (animatedRemaining / 100) * FULL_CIRCLE_RADIANS;
    const startAngleRad = TOP_ANGLE;
    // For full circle, we need to go slightly less than full to ensure the arc renders
    // Otherwise SVG won't draw when start and end are the same point
    const effectiveAngle = animatedRemaining >= 100 
      ? FULL_CIRCLE_RADIANS - 0.001 // Slightly less than full circle to ensure rendering
      : remainingAngle;
    const endAngleRad = startAngleRad - effectiveAngle; // Counter-clockwise
    
    return createArcPath(centerX, centerY, radius, startAngleRad, endAngleRad, 0);
  }, [isOverspent, animatedRemaining, centerX, centerY, radius]);
  
  const excessPath = React.useMemo(() => {
    if (!isOverspent || excessProgress <= 0) return '';
    
    const excessAngle = (excessProgress / 100) * FULL_CIRCLE_RADIANS;
    const startAngleRad = TOP_ANGLE;
    const endAngleRad = startAngleRad + excessAngle; // Clockwise
    
    return createArcPath(centerX, centerY, radius, startAngleRad, endAngleRad, 1);
  }, [isOverspent, excessProgress, centerX, centerY, radius]);
  
  const transformStyle = `rotate(${PATH_COUNTER_ROTATION}deg)`;
  
  return (
    <svg
      ref={ref}
      width={size}
      height={size}
      className={cn("transform -rotate-90", className)}
      {...props}
    >
      {/* Background circle */}
      <circle
        cx={centerX}
        cy={centerY}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="opacity-20"
      />
      
      {/* Remaining progress path (when NOT overspent) - counter-clockwise from top */}
      {!isOverspent && remainingPath && (
        <g style={{ transform: transformStyle, transformOrigin: 'center' }}>
          <path
            d={remainingPath}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className="text-foreground"
          />
        </g>
      )}
      
      {/* Excess progress path (when overspent) - clockwise from top */}
      {isOverspent && excessPath && (
        <g style={{ transform: transformStyle, transformOrigin: 'center' }}>
          <path
            d={excessPath}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className="text-destructive"
          />
        </g>
      )}
    </svg>
  );
});

CircularProgress.displayName = "CircularProgress"


"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface CircularProgressProps {
  value: number // 0-100+ (can exceed 100 for overspent)
  remaining?: number // 0-100 (remaining percentage)
  size?: number
  strokeWidth?: number
  className?: string
}

const DEFAULT_SIZE = 120;
const DEFAULT_STROKE_WIDTH = 8;
const PATH_COUNTER_ROTATION = 90; // degrees to counteract SVG rotation
const TOP_ANGLE = -Math.PI / 2; // -90deg = top in standard coords
const FULL_CIRCLE_RADIANS = 2 * Math.PI;
const HALF_CIRCLE_RADIANS = Math.PI;

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
>(({ value, remaining = 0, size = DEFAULT_SIZE, strokeWidth = DEFAULT_STROKE_WIDTH, className, ...props }, ref) => {
  const radius = (size - strokeWidth) / 2;
  const centerX = size / 2;
  const centerY = size / 2;
  
  const isOverspent = value > 100;
  const excessPercentage = isOverspent ? value - 100 : 0;
  const excessProgress = Math.min(100, excessPercentage);
  
  // Calculate arc paths
  const remainingPath = React.useMemo(() => {
    if (isOverspent || remaining <= 0) return '';
    
    const remainingAngle = (remaining / 100) * FULL_CIRCLE_RADIANS;
    const startAngleRad = TOP_ANGLE;
    // For full circle, we need to go slightly less than full to ensure the arc renders
    // Otherwise SVG won't draw when start and end are the same point
    const effectiveAngle = remaining >= 100 
      ? FULL_CIRCLE_RADIANS - 0.001 // Slightly less than full circle to ensure rendering
      : remainingAngle;
    const endAngleRad = startAngleRad - effectiveAngle; // Counter-clockwise
    
    return createArcPath(centerX, centerY, radius, startAngleRad, endAngleRad, 0);
  }, [isOverspent, remaining, centerX, centerY, radius]);
  
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
            className="text-foreground transition-all duration-500 ease-in-out"
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
            className="text-destructive transition-all duration-500 ease-in-out"
          />
        </g>
      )}
    </svg>
  );
});

CircularProgress.displayName = "CircularProgress"


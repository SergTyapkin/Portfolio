import {isMobile} from '~/utils/utils';

export const CAMERA_Z = isMobile() ? -200 : -100;

export const BEVEL_HEIGHT = 10;
export const BEVEL_SIZE = 10;
export const BEVEL_QUALITY = 30; // 10
export const ROUNDNESS_RADIUS = 15;
export const ROUNDNESS_QUALITY = 12; // 5
export const THICKNESS = 3;
export const MOTION_AMPLITUDE_MIN = 10;
export const MOTION_AMPLITUDE_MAX = 30;
export const MOTION_OFFSET_RANGE_MIN = -20;
export const MOTION_OFFSET_RANGE_MAX = 20;
export const MOTION_SPEED_RANGE_MIN = 1.0;
export const MOTION_SPEED_RANGE_MAX = 2.0;
export const SELECTING_OFFSET = 50;

export const BOX_WIDTH = 400 + THICKNESS;
export const BOX_HEIGHT = 250 + THICKNESS;
export const BOX_DEPTH = 150;

export const BLOCK_DEPTH = 150;
export const BLOCK_SIDE = 50;

export const CONTROLS_SAFE_ZONE_FACTOR = 0.15; // percent from total screen size
export const CONTROLS_SAFE_ZONE_ANGLE_VERTICAL = 70;
export const CONTROLS_SAFE_ZONE_ANGLE_HORIZONTAL = 60;
export const CONTROLS_VERTICAL_ANGLE_CENTER = 30;

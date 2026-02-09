/**
 * Icon Component
 * RentAScooter Design System
 *
 * Unified icon system using react-native-svg
 * Based on Gildey design system patterns
 *
 * Sizes:
 * - xs: 16px - Small inline icons
 * - sm: 20px - Default inline icons
 * - md: 24px - Standard UI icons (default)
 * - lg: 32px - Emphasis icons, navigation
 * - xl: 40px - Hero icons
 *
 * Colors:
 * - primary: Golden yellow
 * - secondary: Vibrant orange
 * - muted: Subtle gray
 * - success: Green
 * - warning: Amber
 * - error: Red
 * - info: Blue
 * - inherit: Uses provided color prop directly
 */

import React from 'react';
import { View, ViewStyle } from 'react-native';
import Svg, { Path, Circle, G, Rect, Line, Polyline } from 'react-native-svg';
import { lightColors } from '../theme/colors';
import { AssetIcon, assetIconRegistry, hasAssetIcon, type AssetIconName } from './AssetIcon';

// =============================================================================
// SIZE MAPPING
// =============================================================================

export const iconSizes = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 40,
} as const;

export type IconSize = keyof typeof iconSizes;

// =============================================================================
// COLOR MAPPING
// =============================================================================

export const iconColors = {
  primary: lightColors.primary[400],
  secondary: lightColors.secondary[500],
  muted: lightColors.neutral[500],
  success: lightColors.semantic.success,
  warning: lightColors.semantic.warning,
  error: lightColors.semantic.error,
  info: lightColors.semantic.info,
  inherit: undefined, // Will use the color prop directly
} as const;

export type IconColor = keyof typeof iconColors;

// =============================================================================
// ICON COMPONENT TYPES
// =============================================================================

export interface SvgIconProps {
  size: number;
  color: string;
  strokeWidth?: number;
}

type IconComponent = React.FC<SvgIconProps>;

// =============================================================================
// ICON REGISTRY - Add your custom icons here
// =============================================================================

// Navigation Icons
const HomeIcon: IconComponent = ({ size, color, strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9 22V12h6v10"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SearchIcon: IconComponent = ({ size, color, strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={11} cy={11} r={8} stroke={color} strokeWidth={strokeWidth} />
    <Path
      d="M21 21l-4.35-4.35"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const UserIcon: IconComponent = ({ size, color, strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx={12} cy={7} r={4} stroke={color} strokeWidth={strokeWidth} />
  </Svg>
);

const SettingsIcon: IconComponent = ({ size, color, strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={strokeWidth} />
    <Path
      d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const BellIcon: IconComponent = ({ size, color, strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 8A6 6 0 106 8c0 7-3 9-3 9h18s-3-2-3-9"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M13.73 21a2 2 0 01-3.46 0"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const MenuIcon: IconComponent = ({ size, color, strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1={3} y1={12} x2={21} y2={12} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1={3} y1={6} x2={21} y2={6} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1={3} y1={18} x2={21} y2={18} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

// Chevron Icons
const ChevronLeftIcon: IconComponent = ({ size, color, strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline
      points="15 18 9 12 15 6"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ChevronRightIcon: IconComponent = ({ size, color, strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline
      points="9 18 15 12 9 6"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ChevronDownIcon: IconComponent = ({ size, color, strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline
      points="6 9 12 15 18 9"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ChevronUpIcon: IconComponent = ({ size, color, strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline
      points="18 15 12 9 6 15"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Close Icon
const CloseIcon: IconComponent = ({ size, color, strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1={18} y1={6} x2={6} y2={18} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1={6} y1={6} x2={18} y2={18} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

// Location & Map Icons
const MapPinIcon: IconComponent = ({ size, color, strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx={12} cy={10} r={3} stroke={color} strokeWidth={strokeWidth} />
  </Svg>
);

const NavigationIcon: IconComponent = ({ size, color, strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 11l19-9-9 19-2-8-8-2z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Transport Icons - Scooter (Figma detailed design)
const ScooterIcon: IconComponent = ({ size, color }) => (
  <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <Path
      d="M17.846 11.7142L16.9894 6.96522C16.9707 6.86128 16.9337 6.76245 16.8805 6.67438C16.8273 6.5863 16.7589 6.51071 16.6794 6.45191C16.5999 6.39311 16.5107 6.35226 16.4169 6.33169C16.3231 6.31112 16.2266 6.31123 16.1328 6.33202C16.0391 6.35281 15.95 6.39387 15.8705 6.45285C15.7911 6.51183 15.7229 6.58758 15.6699 6.67578C15.6169 6.76398 15.58 6.86289 15.5615 6.96688C15.5429 7.07086 15.543 7.17788 15.5618 7.28182L16.2756 11.1364C16.0863 11.1062 15.8957 11.0877 15.7045 11.081C14.6931 11.0822 13.7147 11.4801 12.9425 12.2045C12.1703 12.9288 11.6543 13.9328 11.4857 15.0385H2.24146C2.46267 14.3255 2.88442 13.71 3.44468 13.2825C4.00494 12.8551 4.67413 12.6383 5.35381 12.664C5.86623 12.6615 6.37296 12.7831 6.83861 13.0202C6.92434 13.0724 7.01883 13.1045 7.11623 13.1146C7.21362 13.1246 7.31183 13.1123 7.40476 13.0785C7.4977 13.0447 7.58338 12.9901 7.65648 12.918C7.72958 12.846 7.78855 12.758 7.82973 12.6596C7.8709 12.5613 7.8934 12.4546 7.89584 12.3461C7.89827 12.2377 7.88058 12.1299 7.84388 12.0294C7.80717 11.9289 7.75222 11.8378 7.68244 11.7618C7.61266 11.6858 7.52954 11.6265 7.43823 11.5876C6.78615 11.2486 6.07398 11.0756 5.35381 11.081C4.58511 11.0715 3.82589 11.2698 3.14182 11.6587C2.45775 12.0476 1.86941 12.6154 1.42768 13.3131V9.49803H7.46679L8.5661 11.3027C8.67083 11.4777 8.81296 11.6213 8.97985 11.7208C9.14674 11.8202 9.3332 11.8723 9.52265 11.8725H12.378C12.5325 11.8779 12.6864 11.8486 12.8305 11.7864C12.9745 11.7243 13.1058 11.6305 13.2164 11.5108C13.3271 11.3911 13.4148 11.2479 13.4743 11.0897C13.5339 10.9316 13.564 10.7617 13.563 10.5903V4.74901H17.846C18.414 4.74901 18.9587 4.49884 19.3603 4.05354C19.762 3.60823 19.9876 3.00427 19.9876 2.37451C19.9876 1.74475 19.762 1.14078 19.3603 0.695477C18.9587 0.250171 18.414 9.38413e-09 17.846 0H11.4215C11.2321 0 11.0506 0.0833904 10.9167 0.231826C10.7828 0.380261 10.7076 0.581583 10.7076 0.791502V1.583H9.99379C9.80446 1.583 9.6229 1.6664 9.48903 1.81483C9.35515 1.96327 9.27995 2.16459 9.27995 2.37451C9.27995 2.58443 9.35515 2.78575 9.48903 2.93418C9.6229 3.08262 9.80446 3.16601 9.99379 3.16601H10.7076V3.95751C10.7076 4.16743 10.7828 4.36875 10.9167 4.51719C11.0506 4.66562 11.2321 4.74901 11.4215 4.74901H12.1353V10.2895H9.66542L8.80167 8.85691C9.03863 8.57573 9.19616 8.22379 9.25483 7.8445C9.3135 7.46521 9.27074 7.07518 9.13183 6.72252C8.99292 6.36986 8.76393 6.07001 8.47312 5.85997C8.18231 5.64992 7.84241 5.53887 7.49534 5.54052H1.42768C1.23836 5.54052 1.05679 5.62391 0.922921 5.77234C0.78905 5.92078 0.713842 6.1221 0.713842 6.33202V8.08124C0.500719 8.20248 0.321555 8.38603 0.195734 8.61203C0.0699135 8.83804 0.0022276 9.09789 0 9.36347V15.1731C0 15.5573 0.137631 15.9257 0.382615 16.1973C0.6276 16.4689 0.95987 16.6216 1.30633 16.6216H2.89106C2.92989 17.532 3.2834 18.3909 3.87822 19.02C4.47304 19.649 5.26349 20 6.0855 20C6.90752 20 7.69797 19.649 8.29279 19.02C8.88761 18.3909 9.24112 17.532 9.27995 16.6216H12.9205C13.0195 17.4844 13.4011 18.2769 13.9926 18.8482C14.5842 19.4195 15.3445 19.7297 16.1289 19.72C16.9134 19.7102 17.6672 19.3811 18.247 18.7952C18.8269 18.2093 19.1923 17.4075 19.2737 16.5424C19.4504 16.4797 19.6084 16.3648 19.7306 16.21C19.8282 16.0942 19.9023 15.9566 19.9479 15.8064C19.9934 15.6562 20.0094 15.4969 19.9947 15.3393C19.9254 14.5882 19.694 13.8666 19.32 13.2356C18.946 12.6046 18.4404 12.0828 17.846 11.7142V11.7142ZM18.5599 2.37451C18.5599 2.58443 18.4847 2.78575 18.3508 2.93418C18.2169 3.08262 18.0354 3.16601 17.846 3.16601H17.1322V1.583H17.846C18.0354 1.583 18.2169 1.6664 18.3508 1.81483C18.4847 1.96327 18.5599 2.16459 18.5599 2.37451ZM12.1353 1.583H15.7045V3.16601H12.1353C12.3246 3.16601 12.5062 3.08262 12.6401 2.93418C12.7739 2.78575 12.8492 2.58443 12.8492 2.37451C12.8492 2.16459 12.7739 1.96327 12.6401 1.81483C12.5062 1.6664 12.3246 1.583 12.1353 1.583ZM2.14153 7.12352H7.49534C7.59 7.12352 7.68079 7.16522 7.74772 7.23943C7.81466 7.31365 7.85226 7.41431 7.85226 7.51927C7.85226 7.62423 7.81466 7.72489 7.74772 7.79911C7.68079 7.87333 7.59 7.91502 7.49534 7.91502H2.14153V7.12352ZM15.7045 12.664C16.3384 12.6628 16.9546 12.8955 17.4561 13.3254C17.9576 13.7553 18.3158 14.358 18.4742 15.0385H12.942C13.1001 14.3593 13.4572 13.7576 13.9573 13.3278C14.4573 12.898 15.0719 12.6646 15.7045 12.664ZM6.06766 18.2046C5.65625 18.2047 5.25745 18.0471 4.93875 17.7587C4.62005 17.4702 4.40103 17.0685 4.31874 16.6216H7.85226C7.76883 17.0752 7.54455 17.4821 7.21847 17.7714C6.89239 18.0606 6.48516 18.2139 6.06766 18.2046V18.2046ZM16.0614 18.2046C15.65 18.2047 15.2512 18.0471 14.9325 17.7587C14.6138 17.4702 14.3948 17.0685 14.3125 16.6216H17.846C17.7626 17.0752 17.5383 17.4821 17.2123 17.7714C16.8862 18.0606 16.4789 18.2139 16.0614 18.2046V18.2046Z"
      fill={color}
    />
  </Svg>
);

const RidesIcon: IconComponent = ({ size, color, strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Simple route indicator */}
    <Circle cx={12} cy={5} r={2} stroke={color} strokeWidth={strokeWidth} />
    <Circle cx={12} cy={19} r={2} stroke={color} strokeWidth={strokeWidth} />
    <Path
      d="M12 7v10"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeDasharray="3 3"
    />
  </Svg>
);

// Financial Icons
const EarningsIcon: IconComponent = ({ size, color, strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 1v22M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const WalletIcon: IconComponent = ({ size, color, strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x={2} y={4} width={20} height={16} rx={2} stroke={color} strokeWidth={strokeWidth} />
    <Path d="M22 10H18a2 2 0 100 4h4" stroke={color} strokeWidth={strokeWidth} />
  </Svg>
);

const CreditCardIcon: IconComponent = ({ size, color, strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x={1} y={4} width={22} height={16} rx={2} ry={2} stroke={color} strokeWidth={strokeWidth} />
    <Line x1={1} y1={10} x2={23} y2={10} stroke={color} strokeWidth={strokeWidth} />
  </Svg>
);

// Status Icons
const CheckIcon: IconComponent = ({ size, color, strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline
      points="20 6 9 17 4 12"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CheckCircleIcon: IconComponent = ({ size, color, strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={strokeWidth} />
    <Polyline
      points="9 12 11 14 15 10"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const AlertCircleIcon: IconComponent = ({ size, color, strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={strokeWidth} />
    <Line x1={12} y1={8} x2={12} y2={12} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1={12} y1={16} x2={12.01} y2={16} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

const AlertTriangleIcon: IconComponent = ({ size, color, strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Line x1={12} y1={9} x2={12} y2={13} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1={12} y1={17} x2={12.01} y2={17} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

const InfoIcon: IconComponent = ({ size, color, strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={strokeWidth} />
    <Line x1={12} y1={16} x2={12} y2={12} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1={12} y1={8} x2={12.01} y2={8} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

const XCircleIcon: IconComponent = ({ size, color, strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={strokeWidth} />
    <Line x1={15} y1={9} x2={9} y2={15} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1={9} y1={9} x2={15} y2={15} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

const HelpCircleIcon: IconComponent = ({ size, color, strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={strokeWidth} />
    <Path
      d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Line x1={12} y1={17} x2={12.01} y2={17} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

// Action Icons
const PlusIcon: IconComponent = ({ size, color, strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1={12} y1={5} x2={12} y2={19} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1={5} y1={12} x2={19} y2={12} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

const MinusIcon: IconComponent = ({ size, color, strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1={5} y1={12} x2={19} y2={12} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

const EditIcon: IconComponent = ({ size, color, strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const TrashIcon: IconComponent = ({ size, color, strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="3 6 5 6 21 6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Path
      d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Communication Icons
const PhoneIcon: IconComponent = ({ size, color, strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const MailIcon: IconComponent = ({ size, color, strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Polyline points="22,6 12,13 2,6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

const MessageIcon: IconComponent = ({ size, color, strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Time Icons
const ClockIcon: IconComponent = ({ size, color, strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={strokeWidth} />
    <Polyline points="12 6 12 12 16 14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

const HistoryIcon: IconComponent = ({ size, color, strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 8v4l3 3"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={strokeWidth} />
    <Path
      d="M12 2a10 10 0 0 1 7.38 3.67"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
  </Svg>
);

const CalendarIcon: IconComponent = ({ size, color, strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x={3} y={4} width={18} height={18} rx={2} ry={2} stroke={color} strokeWidth={strokeWidth} />
    <Line x1={16} y1={2} x2={16} y2={6} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1={8} y1={2} x2={8} y2={6} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1={3} y1={10} x2={21} y2={10} stroke={color} strokeWidth={strokeWidth} />
  </Svg>
);

// Rating Icon
const StarIcon: IconComponent = ({ size, color, strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Star Filled - Figma design (golden star)
const StarFilledIcon: IconComponent = ({ size, color }) => (
  <Svg width={size} height={size} viewBox="0 0 14 15" fill="none">
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M6.89188 12L2.63257 14.4721L3.44603 9.23607L0.000170737 5.52786L4.76223 4.76393L6.89188 0L9.02154 4.76393L13.7836 5.52786L10.3377 9.23607L11.1512 14.4721L6.89188 12Z"
      fill={color}
    />
  </Svg>
);

// Auth Icons
const LockIcon: IconComponent = ({ size, color, strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x={3} y={11} width={18} height={11} rx={2} ry={2} stroke={color} strokeWidth={strokeWidth} />
    <Path d="M7 11V7a5 5 0 0110 0v4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

const UnlockIcon: IconComponent = ({ size, color, strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x={3} y={11} width={18} height={11} rx={2} ry={2} stroke={color} strokeWidth={strokeWidth} />
    <Path d="M7 11V7a5 5 0 019.9-1" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

const LogoutIcon: IconComponent = ({ size, color, strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Polyline points="16 17 21 12 16 7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1={21} y1={12} x2={9} y2={12} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

const LoginIcon: IconComponent = ({ size, color, strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Polyline points="10 17 15 12 10 7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1={15} y1={12} x2={3} y2={12} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

// Visibility Icons
const EyeIcon: IconComponent = ({ size, color, strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke={color} strokeWidth={strokeWidth} />
    <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={strokeWidth} />
  </Svg>
);

const EyeOffIcon: IconComponent = ({ size, color, strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    <Line x1={1} y1={1} x2={23} y2={23} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

// More Options Icons
const MoreVerticalIcon: IconComponent = ({ size, color, strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={1} stroke={color} strokeWidth={strokeWidth} fill={color} />
    <Circle cx={12} cy={5} r={1} stroke={color} strokeWidth={strokeWidth} fill={color} />
    <Circle cx={12} cy={19} r={1} stroke={color} strokeWidth={strokeWidth} fill={color} />
  </Svg>
);

const MoreHorizontalIcon: IconComponent = ({ size, color, strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={1} stroke={color} strokeWidth={strokeWidth} fill={color} />
    <Circle cx={19} cy={12} r={1} stroke={color} strokeWidth={strokeWidth} fill={color} />
    <Circle cx={5} cy={12} r={1} stroke={color} strokeWidth={strokeWidth} fill={color} />
  </Svg>
);

// Misc Icons
const RefreshIcon: IconComponent = ({ size, color, strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="23 4 23 10 17 10" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Polyline points="1 20 1 14 7 14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Path
      d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
  </Svg>
);

const FilterIcon: IconComponent = ({ size, color, strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ShareIcon: IconComponent = ({ size, color, strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={18} cy={5} r={3} stroke={color} strokeWidth={strokeWidth} />
    <Circle cx={6} cy={12} r={3} stroke={color} strokeWidth={strokeWidth} />
    <Circle cx={18} cy={19} r={3} stroke={color} strokeWidth={strokeWidth} />
    <Line x1={8.59} y1={13.51} x2={15.42} y2={17.49} stroke={color} strokeWidth={strokeWidth} />
    <Line x1={15.41} y1={6.51} x2={8.59} y2={10.49} stroke={color} strokeWidth={strokeWidth} />
  </Svg>
);

const CameraIcon: IconComponent = ({ size, color, strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx={12} cy={13} r={4} stroke={color} strokeWidth={strokeWidth} />
  </Svg>
);

const HeartIcon: IconComponent = ({ size, color, strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Flag Icon
const FlagIcon: IconComponent = ({ size, color, strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" stroke={color} strokeWidth={strokeWidth} />
    <Line x1={4} y1={22} x2={4} y2={15} stroke={color} strokeWidth={strokeWidth} />
  </Svg>
);

// Document Icon
const DocumentIcon: IconComponent = ({ size, color, strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Polyline points="14 2 14 8 20 8" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1={16} y1={13} x2={8} y2={13} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1={16} y1={17} x2={8} y2={17} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1={10} y1={9} x2={8} y2={9} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

// Shield Icon
const ShieldIcon: IconComponent = ({ size, color, strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// =============================================================================
// FIGMA DESIGN ICONS - RentAScooter App Specific
// =============================================================================

// Helmet Icon - Driver app (120x120 original)
const HelmetIcon: IconComponent = ({ size, color }) => (
  <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
    <Path
      d="M106.087 37.8L105.45 36.3C104.244 33.4497 102.762 30.7242 101.025 28.1625C99.9375 26.625 98.775 25.125 97.5375 23.7C95.7597 21.6782 93.8154 19.8091 91.725 18.1125C87.8111 14.9406 83.4191 12.4091 78.7125 10.6125C77.1889 10.034 75.6369 9.53334 74.0625 9.11254C70.1534 8.03691 66.1169 7.4945 62.0625 7.50004C61.0679 7.50004 60.1141 7.89513 59.4108 8.59839C58.7076 9.30165 58.3125 10.2555 58.3125 11.25C58.3125 12.2446 58.7076 13.1984 59.4108 13.9017C60.1141 14.605 61.0679 15 62.0625 15C65.4576 15.0011 68.8374 15.4551 72.1125 16.35C75.4846 17.2662 78.724 18.6149 81.75 20.3625C85.558 22.5491 88.979 25.3492 91.875 28.65C92.9376 29.8388 93.9269 31.0912 94.8375 32.4C95.8998 34.0348 96.8519 35.7386 97.6875 37.5C92.8875 35.475 86.4375 33.15 80.4 35.4375C74.3625 37.725 70.0125 43.9125 67.95 52.5C65.8875 61.0875 67.0875 68.475 71.0625 72.9375C73.8849 75.6933 77.5345 77.4457 81.45 77.925C84.3375 78.5625 85.7625 78.975 86.25 79.95C86.4926 80.5038 86.5707 81.1156 86.475 81.7125C86.2239 83.0323 85.5057 84.2173 84.4519 85.0507C83.3982 85.884 82.0796 86.3098 80.7375 86.25H60C59.7892 86.2113 59.5732 86.2113 59.3625 86.25C59.1129 86.2292 58.862 86.2292 58.6125 86.25V86.25C58.253 86.4044 57.9231 86.6201 57.6375 86.8875C57.6375 86.8875 57.6375 86.8875 57.4125 86.8875C57.2135 87.1064 57.0376 87.3452 56.8875 87.6C56.8875 87.7875 56.6625 87.9 56.5875 88.0875C56.5125 88.275 56.5875 88.3125 56.5875 88.425C56.3622 88.9194 56.2471 89.4568 56.25 90C56.2149 90.2237 56.2149 90.4514 56.25 90.675C56.2319 90.9122 56.2319 91.1504 56.25 91.3875L63.75 110.138C64.0429 110.879 64.5643 111.507 65.2386 111.932C65.9129 112.357 66.705 112.556 67.5 112.5C67.9064 112.49 68.3098 112.427 68.7 112.313L79.95 108.563C80.8634 108.283 81.6358 107.666 82.1097 106.837C82.5836 106.008 82.7232 105.029 82.5 104.1L79.8 93.75H80.7375C83.9316 93.8091 87.0371 92.6977 89.4685 90.6255C91.9 88.5532 93.4895 85.6632 93.9375 82.5C94.1723 80.5252 93.8474 78.5242 93 76.725C91.9419 74.9938 90.4837 73.5418 88.7479 72.4912C87.0121 71.4406 85.0495 70.822 83.025 70.6875C80.6858 70.4578 78.4736 69.5154 76.6875 67.9875C74.4375 65.5125 73.875 60 75.225 54.3375C75.6052 51.9112 76.5059 49.5959 77.8652 47.5504C79.2245 45.505 81.0103 43.7779 83.1 42.4875C86.85 41.0625 92.25 43.3875 96.225 45.1125C100.2 46.8375 104.512 48.6375 106.875 45.1125C108.225 42.75 107.437 40.875 106.087 37.8ZM74.2875 102.525L69.675 104.063L65.55 93.75H72.075L74.2875 102.525Z"
      fill={color}
    />
    <Path
      d="M48.75 86.25H37.8375C37.5754 86.2449 37.3233 86.1485 37.1247 85.9773C36.9262 85.8061 36.7936 85.571 36.75 85.3125C35.9658 82.2919 34.6995 79.4175 33 76.8C31.5095 74.4195 29.7059 72.2501 27.6375 70.35C26.1132 69.0429 24.842 67.4667 23.8875 65.7C22.617 62.7226 22.139 59.467 22.5 56.25V54.6C22.5025 47.5022 24.4109 40.5353 28.0257 34.4269C31.6406 28.3186 36.8293 23.293 43.05 19.875C43.4809 19.6288 43.8591 19.3001 44.163 18.9077C44.4668 18.5153 44.6904 18.0669 44.821 17.5881C44.9516 17.1093 44.9866 16.6095 44.924 16.1172C44.8614 15.6248 44.7025 15.1497 44.4563 14.7188C44.21 14.2879 43.8813 13.9097 43.4889 13.6058C43.0966 13.3019 42.6482 13.0783 42.1694 12.9477C41.2024 12.684 40.1702 12.8152 39.3 13.3125C31.9349 17.3915 25.7966 23.3687 21.5233 30.6229C17.2499 37.877 14.9975 46.1433 15 54.5625V56.25C14.6562 60.7587 15.4829 65.2797 17.4 69.375C18.7295 71.7716 20.4537 73.9268 22.5 75.75C24.1122 77.2075 25.5245 78.872 26.7 80.7C27.8929 82.6931 28.7779 84.855 29.325 87.1125C29.7894 89.0157 30.8825 90.7065 32.4274 91.9111C33.9723 93.1157 35.8785 93.7636 37.8375 93.75H48.75C49.7446 93.75 50.6984 93.3549 51.4016 92.6517C52.1049 91.9484 52.5 90.9946 52.5 90C52.5 89.0055 52.1049 88.0516 51.4016 87.3484C50.6984 86.6451 49.7446 86.25 48.75 86.25Z"
      fill={color}
    />
    <Path
      d="M58.125 82.5C59.9792 82.5 61.7918 81.9502 63.3335 80.92C64.8752 79.8899 66.0768 78.4257 66.7864 76.7127C67.4959 74.9996 67.6816 73.1146 67.3199 71.296C66.9581 69.4775 66.0652 67.807 64.7541 66.4959C63.443 65.1848 61.7725 64.2919 59.954 63.9301C58.1354 63.5684 56.2504 63.7541 54.5373 64.4636C52.8243 65.1732 51.3601 66.3748 50.33 67.9165C49.2998 69.4582 48.75 71.2708 48.75 73.125C48.75 75.6114 49.7377 77.996 51.4959 79.7541C53.254 81.5123 55.6386 82.5 58.125 82.5ZM58.125 71.25C58.4958 71.25 58.8584 71.36 59.1667 71.566C59.475 71.772 59.7154 72.0649 59.8573 72.4075C59.9992 72.7501 60.0363 73.1271 59.964 73.4908C59.8916 73.8545 59.7131 74.1886 59.4508 74.4508C59.1886 74.7131 58.8545 74.8916 58.4908 74.964C58.1271 75.0363 57.7501 74.9992 57.4075 74.8573C57.0649 74.7154 56.772 74.475 56.566 74.1667C56.36 73.8584 56.25 73.4958 56.25 73.125C56.25 72.6277 56.4475 72.1508 56.7992 71.7992C57.1508 71.4475 57.6277 71.25 58.125 71.25Z"
      fill={color}
    />
  </Svg>
);

// User Silhouette - Filled profile icon (16x18 original)
const UserSilhouetteIcon: IconComponent = ({ size, color }) => (
  <Svg width={size} height={size} viewBox="0 0 16 18" fill="none">
    <Path
      d="M11.5996 10.9092C13.8901 10.9092 15.7863 12.686 15.9834 14.9902L15.9961 15.1729L16 15.3633V17.1816C16 17.6012 15.6908 17.9469 15.293 17.9941L15.2002 18H0.799805C0.389678 17.9999 0.0521348 17.6841 0.00585938 17.2773L0 17.1816V15.3633C0.000179355 13.0401 1.76014 11.1244 4.03223 10.9258L4.21191 10.9131L4.40039 10.9092H11.5996ZM4.26758 12.5488C2.82776 12.6162 1.6818 13.7749 1.60449 15.209L1.59961 15.3633V16.3633H14.4004V15.3828L14.3965 15.2305C14.33 13.7852 13.1825 12.6279 11.7539 12.5498L11.5996 12.5459L4.41797 12.5449L4.26758 12.5488ZM8 0C10.4277 0 12.4002 1.99184 12.4004 4.4541C12.4004 6.91657 10.4278 8.90918 8 8.90918C5.57216 8.90918 3.59961 6.91657 3.59961 4.4541C3.59985 1.99184 5.5723 0 8 0ZM8 1.63672C6.45154 1.63672 5.20043 2.90016 5.2002 4.4541C5.2002 6.00825 6.45139 7.27246 8 7.27246C9.54861 7.27246 10.7998 6.00825 10.7998 4.4541C10.7996 2.90016 9.54846 1.63672 8 1.63672Z"
      fill={color}
    />
  </Svg>
);

// Phone Filled - Golden phone icon (16x17 original)
const PhoneFilledIcon: IconComponent = ({ size, color }) => (
  <Svg width={size} height={size} viewBox="0 0 16 17" fill="none">
    <Path
      d="M4.21266 0.000110848C5.27188 -0.0112036 6.17485 0.844861 6.32398 2.00792C6.40612 2.69416 6.55815 3.368 6.77711 4.01476C7.06702 4.86473 6.88168 5.82305 6.29957 6.47179L5.79566 7.02648L5.84937 7.12023C6.65219 8.4797 7.70466 9.63884 8.93824 10.5235L9.02223 10.5812L9.52808 10.0245C10.0795 9.42361 10.8828 9.20688 11.617 9.44933L11.7537 9.50011C12.3422 9.7421 12.9538 9.9106 13.5828 10.0021C14.6436 10.1672 15.4244 11.1817 15.3982 12.3429V14.6661C15.4005 15.3209 15.1514 15.9461 14.7136 16.3888C14.2758 16.8315 13.6892 17.0507 13.0847 16.9903C10.8108 16.718 8.62634 15.8619 6.71266 14.4943C4.92579 13.2429 3.41022 11.573 2.27808 9.60949C1.02911 7.48469 0.252213 5.0649 0.00855367 2.53527C-0.0446704 1.88514 0.152194 1.24004 0.551522 0.757923C0.950877 0.275847 1.51603 0.000840407 2.10914 0.000110848H4.21266ZM2.11012 1.55089C1.91257 1.55114 1.72372 1.64308 1.59058 1.80382C1.45759 1.96452 1.39227 2.17935 1.40894 2.3839C1.62818 4.6592 2.33054 6.84551 3.46266 8.7716C4.48731 10.5487 5.85445 12.0554 7.47242 13.1886C9.20705 14.4283 11.1817 15.2026 13.2244 15.4474C13.4215 15.4669 13.6166 15.3937 13.7625 15.2462C13.9084 15.0986 13.9918 14.8905 13.991 14.6691V12.3243C13.9998 11.9308 13.7397 11.5923 13.3923 11.5382C12.6644 11.4324 11.9491 11.2358 11.2595 10.9523C11.0025 10.846 10.7127 10.9145 10.5203 11.1241L9.62672 12.1085C9.40283 12.3549 9.05712 12.4068 8.78199 12.2345C6.91072 11.0618 5.36165 9.35343 4.29762 7.29113C4.1412 6.98776 4.18799 6.6072 4.41187 6.36046L5.3025 5.37804C5.49527 5.16283 5.55688 4.84356 5.45973 4.5587C5.20305 3.8006 5.02458 3.01298 4.92945 2.21788C4.88003 1.83256 4.57946 1.54712 4.22633 1.55089H2.11012Z"
      fill={color}
    />
  </Svg>
);

// Message Filled - Chat bubble (16x17 original)
const MessageFilledIcon: IconComponent = ({ size, color }) => (
  <Svg width={size} height={size} viewBox="0 0 16 17" fill="none">
    <Path
      d="M13.0889 0C14.3645 0 15.3983 1.14156 15.3984 2.5498V11.0498C15.3984 12.4582 14.3645 13.6006 13.0889 13.6006H4.16895L1.31445 16.751C0.850555 17.2631 0.0718859 16.9389 0.00488281 16.2471L0 16.1504V2.5498C0.000117748 1.14166 1.03408 0.000151135 2.30957 0H13.0889ZM2.31055 1.7002C1.88539 1.7002 1.54015 2.08046 1.54004 2.5498V14.0967L3.30566 12.1494C3.42599 12.0166 3.58218 11.9316 3.74902 11.9072L3.84961 11.9004H13.0889C13.5141 11.9004 13.8594 11.5193 13.8594 11.0498V2.5498C13.8593 2.08046 13.514 1.7002 13.0889 1.7002H2.31055Z"
      fill={color}
    />
  </Svg>
);

// Order/Receipt Icon (30x30 original)
const OrderIcon: IconComponent = ({ size, color }) => (
  <Svg width={size} height={size} viewBox="0 0 30 30" fill="none">
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M22.8571 2H7.14287C5.40721 2 4 3.39921 4 5.12502V27H5.46692L8.71428 24.6563L11.8571 27L15 24.6563L18.1428 27L21.2857 24.6563L24.533 27H26V5.12502C26 3.39921 24.5927 2 22.8571 2ZM9.75 7H20.25C20.664 7 21 7.448 21 8C21 8.552 20.664 9 20.25 9H9.75C9.336 9 9 8.552 9 8C9 7.448 9.336 7 9.75 7ZM20.25 12H9.75C9.336 12 9 12.448 9 13C9 13.552 9.336 14 9.75 14H20.25C20.664 14 21 13.552 21 13C21 12.448 20.664 12 20.25 12ZM20.25 17H9.75C9.336 17 9 17.448 9 18C9 18.552 9.336 19 9.75 19H20.25C20.664 19 21 18.552 21 18C21 17.448 20.664 17 20.25 17ZM21 22.6249L24 24.88V5.48998C24 4.66677 23.3287 4 22.4999 4H7.49999C6.672 4 6 4.66677 6 5.48998V24.9031L9.00001 22.6249L12 25L15 22.6249L18 25L21 22.6249Z"
      fill={color}
    />
  </Svg>
);

// Position/GPS Crosshair Icon (22x22 original)
const PositionIcon: IconComponent = ({ size, color }) => (
  <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
    <Path
      d="M12 2.05957C16.17 2.51957 19.4804 5.83 19.9404 10H22V12H19.9404C19.4804 16.17 16.17 19.4804 12 19.9404V22H10V19.9404C5.83 19.4804 2.51957 16.17 2.05957 12H0V10H2.05957C2.51957 5.83 5.83 2.51957 10 2.05957V0H12V2.05957ZM11 4C7.13 4 4 7.13 4 11C4 14.87 7.13 18 11 18C14.87 18 18 14.87 18 11C18 7.13 14.87 4 11 4ZM11 7C13.21 7 15 8.79 15 11C15 13.21 13.21 15 11 15C8.79 15 7 13.21 7 11C7 8.79 8.79 7 11 7Z"
      fill={color}
    />
  </Svg>
);

// Speed/Speedometer Icon (30x30 original)
const SpeedIcon: IconComponent = ({ size, color }) => (
  <Svg width={size} height={size} viewBox="0 0 30 30" fill="none">
    <Path
      d="M15 4C23.2833 4 30 10.5829 30 18.7002C30 20.9568 29.4786 23.0907 28.5537 25H26.1367C27.1667 23.2538 27.7568 21.2858 27.8418 19.2246H25.7119V18.1748H27.8555C27.7754 16.2849 27.2712 14.4677 26.3945 12.833L24.5537 13.876L24.0186 12.9639L25.8535 11.9268C25.3502 11.1595 24.7685 10.4439 24.0986 9.78809C23.4153 9.12416 22.6718 8.54054 21.8818 8.04785L20.8232 9.83984L19.8936 9.31445L20.9453 7.52344C19.2854 6.677 17.4501 6.19246 15.5352 6.11328V8.2002H14.4629V6.11426C12.5482 6.19184 10.7135 6.6717 9.05371 7.52441L10.1113 9.31445L9.18164 9.83984L8.12305 8.04785C7.33307 8.54053 6.58956 9.1258 5.90625 9.78809C5.23637 10.4439 4.64629 11.166 4.15137 11.9268L5.99316 12.9639L5.45801 13.876L3.61621 12.833C2.73966 14.4677 2.23627 16.285 2.15625 18.1748H4.28711V19.2246H2.15625C2.24292 21.2858 2.83329 23.2538 3.86328 25H1.44629C0.521361 23.0907 3.01057e-05 20.9584 0 18.7002C0 10.5829 6.71667 4 15 4ZM21 15.5625L16.9883 21.4971C16.9945 21.5819 17.001 21.6652 17.001 21.75C17.001 22.9944 16.106 24 15 24C13.8942 23.9998 13 22.9943 13 21.75C13 20.5057 13.8942 19.5002 15 19.5C15.0745 19.5 15.1495 19.5068 15.2256 19.5137L20.501 15L21 15.5625Z"
      fill={color}
    />
  </Svg>
);

// Location Dot - Start position marker (18x18 original)
const LocationDotIcon: IconComponent = ({ size, color }) => (
  <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
    <Circle
      cx={9}
      cy={9}
      r={5.5}
      fill="white"
      stroke={color}
      strokeWidth={6}
    />
  </Svg>
);

// Send/Navigation Filled Icon (30x26 original)
const SendIcon: IconComponent = ({ size, color }) => (
  <Svg width={size} height={size} viewBox="0 0 30 26" fill="none">
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M29.8385 1.94043L16.7435 25.2697C16.4964 25.7566 16.0821 26 15.5007 26C15.428 26 15.319 25.9861 15.1736 25.9583C14.8538 25.8887 14.5958 25.7322 14.3995 25.4888C14.2033 25.2454 14.1052 24.9707 14.1052 24.6647L14.3995 12.309L1.39084 8.85281C1.07103 8.85281 0.783935 8.75892 0.529545 8.57114C0.275156 8.38336 0.11162 8.13646 0.0389368 7.83044C-0.0337452 7.52442 -0.00467263 7.23231 0.126156 6.95412C0.256985 6.67592 0.467765 6.46727 0.758497 6.32817L27.9633 0.146054C28.1522 0.0486839 28.363 0 28.5956 0C28.9881 0 29.3152 0.132144 29.5768 0.396431C29.7949 0.591169 29.9293 0.831115 29.9802 1.11627C30.0311 1.40142 29.9838 1.67614 29.8385 1.94043Z"
      fill={color}
    />
  </Svg>
);

// Vehicle/Bullet Icon - Scooter marker (45x45 original)
const VehicleIcon: IconComponent = ({ size, color }) => (
  <Svg width={size} height={size} viewBox="0 0 45 45" fill="none">
    <Path
      d="M40.7813 30.9375C40.4083 30.9375 40.0506 31.0856 39.7869 31.3494C39.5232 31.6131 39.375 31.9708 39.375 32.3437C39.375 32.9 39.2101 33.4438 38.9011 33.9063C38.592 34.3688 38.1528 34.7293 37.6388 34.9421C37.1249 35.155 36.5594 35.2107 36.0139 35.1022C35.4683 34.9937 34.9671 34.7258 34.5738 34.3325C34.1805 33.9391 33.9126 33.438 33.8041 32.8924C33.6956 32.3469 33.7513 31.7813 33.9641 31.2674C34.177 30.7535 34.5375 30.3143 35 30.0052C35.4625 29.6962 36.0063 29.5312 36.5625 29.5312C36.7264 29.5265 36.8883 29.4932 37.0407 29.4328L37.1954 29.3625L37.336 29.2922L37.4344 29.2078L37.6313 28.9969L37.786 28.7859C37.8248 28.704 37.8577 28.6194 37.8844 28.5328C37.8924 28.4392 37.8924 28.3451 37.8844 28.2515C37.8844 28.2515 37.9688 28.125 37.9688 28.125C37.9688 28.125 37.9688 28.0406 37.9688 27.9984C37.9768 27.9095 37.9768 27.8201 37.9688 27.7312C37.946 27.6367 37.908 27.5464 37.8563 27.464C37.8563 27.464 37.8563 27.3797 37.8563 27.3515L35.4235 23.6953C35.6142 23.3501 35.7428 22.9741 35.8032 22.5844C35.8095 22.533 35.8095 22.481 35.8032 22.4297C36.0844 22.4297 36.3797 22.5 36.675 22.5C37.048 22.5 37.4057 22.3518 37.6694 22.0881C37.9331 21.8244 38.0813 21.4667 38.0813 21.0937V14.0625C38.0813 13.6895 37.9331 13.3318 37.6694 13.0681C37.4057 12.8044 37.048 12.6562 36.675 12.6562C35.4568 12.606 34.2563 12.9611 33.2613 13.6659C32.2664 14.3708 31.5333 15.3856 31.1766 16.5515C30.8273 16.4953 30.4712 16.4953 30.1219 16.5515L28.8704 14.5969C28.4668 13.9819 27.9124 13.4805 27.26 13.1408C26.6076 12.8011 25.879 12.6342 25.1438 12.6562H22.5C22.1271 12.6562 21.7694 12.8044 21.5057 13.0681C21.242 13.3318 21.0938 13.6895 21.0938 14.0625C21.0938 14.4354 21.242 14.7931 21.5057 15.0568C21.7694 15.3206 22.1271 15.4687 22.5 15.4687H25.1438C25.3937 15.4683 25.6396 15.5313 25.8585 15.6518C26.0774 15.7723 26.2621 15.9464 26.3954 16.1578L27.7032 18.2812C27.5383 18.5669 27.4152 18.8747 27.3375 19.1953C26.2735 18.6499 25.095 18.3654 23.8993 18.3654C22.7036 18.3654 21.525 18.6499 20.461 19.1953C20.1567 19.3784 19.933 19.6697 19.8347 20.0109C19.7364 20.3521 19.7708 20.7179 19.9311 21.0348C20.0913 21.3516 20.3654 21.5962 20.6985 21.7193C21.0315 21.8424 21.3988 21.8349 21.7266 21.6984C22.3943 21.3254 23.1418 21.118 23.9063 21.0937C24.9296 21.0112 25.9446 21.3332 26.7333 21.9904C27.522 22.6477 28.0216 23.5879 28.125 24.6094C28.1256 24.8463 28.0973 25.0824 28.0407 25.3125H19.7719C19.7153 25.0824 19.6869 24.8463 19.6875 24.6094C19.674 24.4503 19.674 24.2903 19.6875 24.1312C19.732 23.819 19.6702 23.5009 19.5121 23.228C19.354 22.9551 19.1087 22.7432 18.8157 22.6265H18.7454C18.689 22.5781 18.6277 22.5357 18.5625 22.5H18.4079H18.2813H12.6563V18.9281C12.6563 17.6377 12.1437 16.4001 11.2312 15.4876C10.3187 14.5751 9.08111 14.0625 7.79067 14.0625C7.21631 14.0625 6.66547 14.2906 6.25934 14.6968C5.85321 15.1029 5.62504 15.6537 5.62504 16.2281V23.9062C5.62504 24.2792 5.7732 24.6369 6.03692 24.9006C6.30065 25.1643 6.65833 25.3125 7.03129 25.3125C7.40425 25.3125 7.76194 25.1643 8.02566 24.9006C8.28938 24.6369 8.43754 24.2792 8.43754 23.9062V16.9734C8.84561 17.1133 9.20013 17.3766 9.45206 17.7267C9.70399 18.0769 9.84087 18.4967 9.84379 18.9281V23.9062C9.84379 24.2792 9.99195 24.6369 10.2557 24.9006C10.5194 25.1643 10.8771 25.3125 11.25 25.3125H16.875C16.9616 26.0437 17.191 26.7508 17.55 27.3937C17.5828 27.4486 17.6205 27.5003 17.6625 27.5484L17.5079 27.8437C17.4662 27.9277 17.4021 27.9984 17.3227 28.048C17.2432 28.0977 17.1515 28.1243 17.0579 28.125H12.6563C12.5076 28.1314 12.3607 28.1598 12.2204 28.2094C11.3639 27.4186 10.283 26.9135 9.12696 26.7638C7.97096 26.6141 6.79699 26.8272 5.76738 27.3737C4.73776 27.9202 3.90336 28.773 3.37953 29.8144C2.85569 30.8557 2.66831 32.034 2.84327 33.1865C3.01824 34.339 3.54692 35.4086 4.35622 36.2475C5.16552 37.0864 6.21545 37.6532 7.36087 37.8695C8.50629 38.0858 9.69062 37.9409 10.7501 37.4548C11.8096 36.9687 12.6919 36.1655 13.275 35.1562H25.3125C25.6168 35.1562 25.9129 35.0575 26.1563 34.875C26.7935 34.3925 27.3613 33.8247 27.8438 33.1875C28.9283 31.6681 29.5176 29.8511 29.5313 27.9844C29.8043 27.8614 30.0309 27.6545 30.1782 27.3937C30.5625 26.7551 30.8203 26.0485 30.9375 25.3125C31.3568 25.486 31.8057 25.5767 32.2594 25.5797C32.5534 25.5761 32.846 25.5383 33.1313 25.4672L34.3125 27.239C33.3811 27.6456 32.5773 28.2969 31.9864 29.1237C31.3955 29.9505 31.0396 30.922 30.9566 31.9348C30.8736 32.9477 31.0665 33.9642 31.5149 34.8762C31.9633 35.7882 32.6504 36.5617 33.5031 37.1144C34.3559 37.6672 35.3425 37.9786 36.3581 38.0156C37.3737 38.0526 38.3804 37.8137 39.2711 37.3244C40.1618 36.8351 40.9033 36.1136 41.4168 35.2367C41.9303 34.3597 42.1967 33.36 42.1875 32.3437C42.1875 31.9708 42.0394 31.6131 41.7757 31.3494C41.5119 31.0856 41.1543 30.9375 40.7813 30.9375ZM8.43754 35.1562C7.88128 35.1562 7.33752 34.9913 6.875 34.6822C6.41249 34.3732 6.052 33.9339 5.83913 33.42C5.62626 32.9061 5.57056 32.3406 5.67908 31.795C5.7876 31.2495 6.05547 30.7483 6.4488 30.355C6.84214 29.9617 7.34328 29.6938 7.88885 29.5853C8.43442 29.4768 8.99992 29.5324 9.51384 29.7453C10.0278 29.9582 10.467 30.3187 10.7761 30.7812C11.0851 31.2437 11.25 31.7875 11.25 32.3437C11.25 33.0897 10.9537 33.805 10.4263 34.3325C9.89883 34.8599 9.18346 35.1562 8.43754 35.1562ZM25.5938 31.5C25.366 31.8073 25.1067 32.0901 24.8204 32.3437H14.0625C14.0553 31.8686 13.9891 31.3963 13.8657 30.9375H17.1C17.7177 30.9398 18.3235 30.7683 18.8482 30.4425C19.3729 30.1167 19.7954 29.6499 20.0672 29.0953L20.5594 28.125H26.7188C26.6823 29.3359 26.2911 30.5094 25.5938 31.5ZM35.1563 15.764V19.3922C34.7727 19.2563 34.4363 19.0131 34.1869 18.6915C33.9376 18.3699 33.786 17.9834 33.75 17.5781C33.786 17.1728 33.9376 16.7863 34.1869 16.4647C34.4363 16.1431 34.7727 15.8999 35.1563 15.764V15.764ZM31.6407 22.5L30.15 20.475C30.0913 20.4033 30.0495 20.3193 30.0276 20.2292C30.0057 20.1392 30.0043 20.0453 30.0235 19.9547C30.0478 19.7708 30.1439 19.604 30.2907 19.4906C30.3671 19.4354 30.4536 19.3959 30.5453 19.3742C30.637 19.3524 30.732 19.349 30.825 19.364C30.9157 19.3764 31.0026 19.4079 31.0802 19.4564C31.1578 19.5049 31.2242 19.5693 31.275 19.6453L32.7797 21.6703C32.8849 21.8221 32.93 22.0075 32.9063 22.1906C32.8717 22.3742 32.7718 22.539 32.625 22.6547C32.4729 22.7615 32.2852 22.8051 32.1016 22.7762C31.918 22.7473 31.7527 22.6483 31.6407 22.5V22.5Z"
      fill={color}
    />
  </Svg>
);

// Destination Dot - End position marker (dark variant)
const DestinationDotIcon: IconComponent = ({ size, color }) => (
  <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
    <Circle
      cx={9}
      cy={9}
      r={5.5}
      fill="white"
      stroke={color}
      strokeWidth={6}
    />
  </Svg>
);

// =============================================================================
// ICON REGISTRY
// =============================================================================

/**
 * Icon Registry
 * Add new icons here to make them available in the Icon component
 *
 * To add a new icon:
 * 1. Create an IconComponent function above
 * 2. Add it to this registry with a unique name
 * 3. The icon will automatically be available via <Icon name="yourIconName" />
 */
export const iconRegistry = {
  // Navigation
  home: HomeIcon,
  search: SearchIcon,
  user: UserIcon,
  profile: UserIcon, // Alias (outline)
  settings: SettingsIcon,
  bell: BellIcon,
  notifications: BellIcon, // Alias
  menu: MenuIcon,

  // Chevrons
  'chevron-left': ChevronLeftIcon,
  'chevron-right': ChevronRightIcon,
  'chevron-down': ChevronDownIcon,
  'chevron-up': ChevronUpIcon,
  back: ChevronLeftIcon, // Alias
  forward: ChevronRightIcon, // Alias

  // Close
  close: CloseIcon,
  x: CloseIcon, // Alias

  // Location
  'map-pin': MapPinIcon,
  location: MapPinIcon, // Alias
  navigation: NavigationIcon,
  flag: FlagIcon,
  'location-dot': LocationDotIcon, // Figma start position marker
  'destination-dot': DestinationDotIcon, // Figma end position marker
  position: PositionIcon, // Figma GPS crosshair
  gps: PositionIcon, // Alias

  // Transport
  scooter: ScooterIcon, // Figma detailed scooter
  rides: RidesIcon,
  'my-rides': RidesIcon, // Alias
  vehicle: VehicleIcon, // Figma scooter marker/bullet
  bullet: VehicleIcon, // Alias

  // Financial
  earnings: EarningsIcon,
  'dollar-sign': EarningsIcon, // Alias
  wallet: WalletIcon,
  'credit-card': CreditCardIcon,
  order: OrderIcon, // Figma receipt icon
  receipt: OrderIcon, // Alias

  // Status
  check: CheckIcon,
  'check-circle': CheckCircleIcon,
  'alert-circle': AlertCircleIcon,
  'alert-triangle': AlertTriangleIcon,
  info: InfoIcon,
  'x-circle': XCircleIcon,
  error: XCircleIcon, // Alias
  'help-circle': HelpCircleIcon,
  speed: SpeedIcon, // Figma speedometer
  speedometer: SpeedIcon, // Alias

  // Actions
  plus: PlusIcon,
  add: PlusIcon, // Alias
  minus: MinusIcon,
  edit: EditIcon,
  trash: TrashIcon,
  delete: TrashIcon, // Alias
  send: SendIcon, // Figma navigation/send icon
  'navigation-filled': SendIcon, // Alias

  // Communication
  phone: PhoneIcon, // Outline
  'phone-filled': PhoneFilledIcon, // Figma filled phone
  call: PhoneFilledIcon, // Alias
  mail: MailIcon,
  email: MailIcon, // Alias
  message: MessageIcon, // Outline
  'message-filled': MessageFilledIcon, // Figma filled message
  chat: MessageIcon, // Alias

  // Time
  clock: ClockIcon,
  time: ClockIcon, // Alias
  history: HistoryIcon,
  calendar: CalendarIcon,

  // Rating
  star: StarIcon,
  'star-filled': StarFilledIcon, // Figma golden star

  // Auth & Profile
  lock: LockIcon,
  unlock: UnlockIcon,
  logout: LogoutIcon,
  login: LoginIcon,
  'user-silhouette': UserSilhouetteIcon, // Figma filled profile
  'profile-filled': UserSilhouetteIcon, // Alias
  helmet: HelmetIcon, // Figma driver helmet

  // Visibility
  eye: EyeIcon,
  'eye-off': EyeOffIcon,

  // More Options
  'more-vertical': MoreVerticalIcon,
  'more-horizontal': MoreHorizontalIcon,

  // Misc
  refresh: RefreshIcon,
  filter: FilterIcon,
  share: ShareIcon,
  camera: CameraIcon,
  heart: HeartIcon,
  favorite: HeartIcon, // Alias

  // Documents & Security
  document: DocumentIcon,
  'document-text': DocumentIcon, // Alias
  file: DocumentIcon, // Alias
  shield: ShieldIcon,
  privacy: ShieldIcon, // Alias
} as const;

export type IconName = keyof typeof iconRegistry | AssetIconName;

// =============================================================================
// ICON COMPONENT
// =============================================================================

export interface IconProps {
  /** Name of the icon from the registry */
  name: IconName;
  /** Size preset or custom number in pixels */
  size?: IconSize | number;
  /** Color preset or custom hex/rgb color */
  color?: IconColor | string;
  /** Stroke width for line icons (default: 2) */
  strokeWidth?: number;
  /** Container style */
  style?: ViewStyle;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Icon Component
 *
 * Renders SVG icons from the icon registry with consistent sizing and coloring.
 *
 * @example
 * // Basic usage
 * <Icon name="home" />
 *
 * // With size and color presets
 * <Icon name="star" size="lg" color="primary" />
 *
 * // With custom size and color
 * <Icon name="map-pin" size={28} color="#FF5500" />
 */
export function Icon({
  name,
  size = 'md',
  color = 'inherit',
  strokeWidth = 2,
  style,
  testID,
}: IconProps) {
  // Resolve size
  const sizeValue = typeof size === 'number' ? size : iconSizes[size];

  // Resolve color
  let colorValue: string;
  if (color === 'inherit') {
    colorValue = lightColors.neutral[900]; // Default to text color
  } else if (color in iconColors) {
    colorValue = iconColors[color as IconColor] || lightColors.neutral[900];
  } else {
    colorValue = color; // Use as custom color
  }

  if (hasAssetIcon(name)) {
    return (
      <AssetIcon
        name={name as AssetIconName}
        size={sizeValue}
        color={colorValue}
        style={style}
        testID={testID}
      />
    );
  }

  const IconComponent = iconRegistry[name as keyof typeof iconRegistry];

  if (!IconComponent) {
    console.warn(`[Icon] Icon "${name}" not found in registry`);
    return null;
  }

  return (
    <View style={style} testID={testID}>
      <IconComponent size={sizeValue} color={colorValue} strokeWidth={strokeWidth} />
    </View>
  );
}

// =============================================================================
// UTILITY EXPORTS
// =============================================================================

/** Get all available icon names (inline + asset) */
export const getIconNames = (): IconName[] =>
  Array.from(
    new Set([...Object.keys(iconRegistry), ...Object.keys(assetIconRegistry)])
  ) as IconName[];

/** Check if an icon exists in the registry (inline or asset) */
export const hasIcon = (name: string): name is IconName =>
  name in iconRegistry || hasAssetIcon(name);

/** Get the size value for a size preset */
export const getIconSize = (size: IconSize | number): number =>
  typeof size === 'number' ? size : iconSizes[size];

/** Get the color value for a color preset */
export const getIconColor = (color: IconColor | string): string => {
  if (color === 'inherit') return lightColors.neutral[900];
  if (color in iconColors) return iconColors[color as IconColor] || lightColors.neutral[900];
  return color;
};

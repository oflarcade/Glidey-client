import { Dimensions, PixelRatio } from 'react-native';

const BASE_WIDTH = 390;
const BASE_UNIT = 16;

export function rem(r: number): number {
  const { width } = Dimensions.get('window');
  const scale = width / BASE_WIDTH;
  return PixelRatio.roundToNearestPixel(r * BASE_UNIT * scale);
}

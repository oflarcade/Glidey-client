import type MapboxGL from '@rnmapbox/maps';

import { ANIMATION_CONFIG, animateToDestination, animateToGuidanceView } from './mapAnimations';

interface MockCamera {
  fitBounds: jest.Mock<Promise<void>, [number[], number[], typeof ANIMATION_CONFIG.PADDING, number]>;
  setCamera: jest.Mock<Promise<void>, [Record<string, unknown>]>;
}

function createCameraRef(camera: MockCamera): { current: MapboxGL.Camera | null } {
  return { current: camera as unknown as MapboxGL.Camera };
}

describe('mapAnimations', () => {
  describe('animateToDestination', () => {
    it('uses fitBounds for long distances', async () => {
      const camera: MockCamera = {
        fitBounds: jest.fn().mockResolvedValue(undefined),
        setCamera: jest.fn().mockResolvedValue(undefined),
      };

      await animateToDestination(
        createCameraRef(camera),
        { latitude: 14.75, longitude: -17.55 },
        { latitude: 14.69, longitude: -17.44 }
      );

      expect(camera.fitBounds).toHaveBeenCalledTimes(1);
      expect(camera.setCamera).not.toHaveBeenCalled();
    });
  });

  describe('animateToGuidanceView', () => {
    it('fits bounds then applies pitched guidance camera', async () => {
      const camera: MockCamera = {
        fitBounds: jest.fn().mockResolvedValue(undefined),
        setCamera: jest.fn().mockResolvedValue(undefined),
      };
      const pickup = { latitude: 14.6937, longitude: -17.4441 };
      const destination = { latitude: 14.7167, longitude: -17.4677 };

      await animateToGuidanceView(createCameraRef(camera), pickup, destination);

      expect(camera.fitBounds).toHaveBeenCalledTimes(1);
      expect(camera.setCamera).toHaveBeenCalledTimes(1);
      expect(camera.setCamera).toHaveBeenCalledWith(
        expect.objectContaining({
          centerCoordinate: [pickup.longitude, pickup.latitude],
          pitch: ANIMATION_CONFIG.GUIDANCE_PITCH,
        })
      );
    });
  });
});

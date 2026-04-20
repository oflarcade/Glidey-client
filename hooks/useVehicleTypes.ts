import { useQuery } from '@tanstack/react-query';
import { getVehicleTypes } from '@/services/bookingService';
import type { VehicleType } from '@rentascooter/shared';

export const vehicleTypesKeys = {
  all: ['vehicleTypes'] as const,
};

export function useVehicleTypes() {
  return useQuery<VehicleType[]>({
    queryKey: vehicleTypesKeys.all,
    queryFn: getVehicleTypes,
    staleTime: 5 * 60 * 1000, // 5 min — matches backend Redis TTL
  });
}

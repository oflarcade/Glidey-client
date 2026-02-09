import { useState, useCallback } from 'react';
import { useOnboardingConfig } from '../context/OnboardingContext';
import { useOnboardingStatus } from './useOnboardingStatus';

export function useOnboardingFlow() {
  const { config } = useOnboardingConfig();
  const { markCompleted } = useOnboardingStatus();
  const [currentIndex, setCurrentIndex] = useState(0);

  const totalSlides = config.slides.length;
  const isFirstSlide = currentIndex === 0;
  const isLastSlide = currentIndex === totalSlides - 1;
  const currentSlide = config.slides[currentIndex];

  const goToNext = useCallback(() => {
    if (!isLastSlide) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [isLastSlide]);

  const goToPrevious = useCallback(() => {
    if (!isFirstSlide) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [isFirstSlide]);

  const goToSlide = useCallback(
    (index: number) => {
      if (index >= 0 && index < totalSlides) {
        setCurrentIndex(index);
      }
    },
    [totalSlides]
  );

  const complete = useCallback(async () => {
    await markCompleted();
  }, [markCompleted]);

  const skip = useCallback(async () => {
    await markCompleted();
  }, [markCompleted]);

  return {
    currentIndex,
    currentSlide,
    totalSlides,
    isFirstSlide,
    isLastSlide,
    goToNext,
    goToPrevious,
    goToSlide,
    complete,
    skip,
  };
}

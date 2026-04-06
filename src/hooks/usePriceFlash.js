import { useEffect, useRef, useState } from 'react';

/**
 * Returns 'up', 'down', or null based on price changes.
 * Resets to null after 1.2 seconds.
 */
export function usePriceFlash(price) {
  const prevPrice = useRef(price);
  const [flash, setFlash] = useState(null);

  useEffect(() => {
    if (prevPrice.current === null || price === null) {
      prevPrice.current = price;
      return;
    }
    if (price > prevPrice.current) {
      setFlash('up');
    } else if (price < prevPrice.current) {
      setFlash('down');
    }
    prevPrice.current = price;
    const timer = setTimeout(() => setFlash(null), 1200);
    return () => clearTimeout(timer);
  }, [price]);

  return flash;
}

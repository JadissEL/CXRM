import * as React from "react";

// 🎨 Performance Optimization Hook
export function usePerformance() {
  const [metrics, setMetrics] = React.useState({
    memoryUsage: 0,
    renderTime: 0,
    loadTime: 0,
    cacheHits: 0,
    cacheMisses: 0
  });

  const cache = React.useRef(new Map());
  const renderStartTime = React.useRef(0);

  // Memory usage monitoring
  React.useEffect(() => {
    const updateMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMetrics(prev => ({
          ...prev,
          memoryUsage: Math.round(memory.usedJSHeapSize / 1024 / 1024) // MB
        }));
      }
    };

    const interval = setInterval(updateMemoryUsage, 5000);
    return () => clearInterval(interval);
  }, []);

  // Render time measurement
  React.useEffect(() => {
    renderStartTime.current = performance.now();
    
    return () => {
      const renderTime = performance.now() - renderStartTime.current;
      setMetrics(prev => ({
        ...prev,
        renderTime: Math.round(renderTime)
      }));
    };
  });

  // Cache management
  const getCached = React.useCallback((key: string) => {
    const cached = cache.current.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      setMetrics(prev => ({ ...prev, cacheHits: prev.cacheHits + 1 }));
      return cached.data;
    }
    setMetrics(prev => ({ ...prev, cacheMisses: prev.cacheMisses + 1 }));
    return null;
  }, []);

  const setCached = React.useCallback((key: string, data: any, ttl: number = 300000) => {
    cache.current.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }, []);

  const clearCache = React.useCallback(() => {
    cache.current.clear();
  }, []);

  return {
    metrics,
    getCached,
    setCached,
    clearCache
  };
}

// 🎨 Debounce Hook
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// 🎨 Throttle Hook
export function useThrottle<T>(value: T, delay: number): T {
  const [throttledValue, setThrottledValue] = React.useState<T>(value);
  const lastRun = React.useRef(Date.now());

  React.useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRun.current >= delay) {
        setThrottledValue(value);
        lastRun.current = Date.now();
      }
    }, delay - (Date.now() - lastRun.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return throttledValue;
}

// 🎨 Intersection Observer Hook
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = React.useState(false);
  const [entry, setEntry] = React.useState<IntersectionObserverEntry | null>(null);
  const elementRef = React.useRef<Element | null>(null);

  const callback = React.useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    setIsIntersecting(entry.isIntersecting);
    setEntry(entry);
  }, []);

  React.useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(callback, options);
    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [callback, options]);

  return { ref: elementRef, isIntersecting, entry };
}

// 🎨 Virtual Scrolling Hook
export function useVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + visibleCount + 1, items.length);

  const visibleItems = items.slice(startIndex, endIndex);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    containerRef,
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    startIndex,
    endIndex
  };
}

// 🎨 Resource Preloading Hook
export function useResourcePreloader() {
  const [loadedResources, setLoadedResources] = React.useState<Set<string>>(new Set());
  const [loadingResources, setLoadingResources] = React.useState<Set<string>>(new Set());

  const preloadImage = React.useCallback((src: string): Promise<void> => {
    if (loadedResources.has(src)) {
      return Promise.resolve();
    }

    if (loadingResources.has(src)) {
      return new Promise((resolve) => {
        const checkLoaded = () => {
          if (loadedResources.has(src)) {
            resolve();
          } else {
            setTimeout(checkLoaded, 100);
          }
        };
        checkLoaded();
      });
    }

    setLoadingResources(prev => new Set(prev).add(src));

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        setLoadedResources(prev => new Set(prev).add(src));
        setLoadingResources(prev => {
          const newSet = new Set(prev);
          newSet.delete(src);
          return newSet;
        });
        resolve();
      };
      img.onerror = reject;
      img.src = src;
    });
  }, [loadedResources, loadingResources]);

  const preloadMultiple = React.useCallback(async (urls: string[]) => {
    const promises = urls.map(url => preloadImage(url));
    await Promise.allSettled(promises);
  }, [preloadImage]);

  return {
    preloadImage,
    preloadMultiple,
    loadedResources,
    loadingResources
  };
}

// 🎨 Memory Management Hook
export function useMemoryManagement() {
  const [memoryInfo, setMemoryInfo] = React.useState({
    used: 0,
    total: 0,
    limit: 0
  });

  const cleanup = React.useCallback(() => {
    // Clear unused references
    if (typeof window !== 'undefined' && 'gc' in window) {
      (window as any).gc();
    }
  }, []);

  const monitorMemory = React.useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      setMemoryInfo({
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024)
      });
    }
  }, []);

  React.useEffect(() => {
    const interval = setInterval(monitorMemory, 10000);
    return () => clearInterval(interval);
  }, [monitorMemory]);

  return {
    memoryInfo,
    cleanup,
    monitorMemory
  };
} 
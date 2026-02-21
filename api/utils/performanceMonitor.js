/**
 * Performance monitoring utility for debugging slow operations
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.enabled = process.env.NODE_ENV === 'development';
  }

  start(label) {
    if (!this.enabled) return;
    this.metrics.set(label, {
      start: Date.now(),
      memory: process.memoryUsage().heapUsed,
    });
  }

  end(label) {
    if (!this.enabled) return;
    
    const metric = this.metrics.get(label);
    if (!metric) {
      console.warn(`⚠️  No start time found for: ${label}`);
      return;
    }

    const duration = Date.now() - metric.start;
    const memoryDiff = process.memoryUsage().heapUsed - metric.memory;
    
    // Log slow operations (> 500ms)
    if (duration > 500) {
      console.warn(`⚠️  SLOW: ${label} took ${duration}ms`);
    } else {
      console.log(`✓ ${label}: ${duration}ms`);
    }

    if (memoryDiff > 10 * 1024 * 1024) { // > 10MB
      console.warn(`⚠️  HIGH MEMORY: ${label} used ${(memoryDiff / 1024 / 1024).toFixed(2)}MB`);
    }

    this.metrics.delete(label);
  }

  measure(label, fn) {
    this.start(label);
    const result = fn();
    
    // Handle promises
    if (result && typeof result.then === 'function') {
      return result.then(data => {
        this.end(label);
        return data;
      }).catch(err => {
        this.end(label);
        throw err;
      });
    }
    
    this.end(label);
    return result;
  }

  async measureAsync(label, fn) {
    this.start(label);
    try {
      const result = await fn();
      this.end(label);
      return result;
    } catch (error) {
      this.end(label);
      throw error;
    }
  }

  summary() {
    console.log('\n📊 Active Performance Measurements:');
    for (const [label, metric] of this.metrics.entries()) {
      const duration = Date.now() - metric.start;
      console.log(`  ⏱️  ${label}: ${duration}ms (still running)`);
    }
  }
}

const monitor = new PerformanceMonitor();

// Express middleware for automatic request timing
function performanceMiddleware(req, res, next) {
  const label = `${req.method} ${req.path}`;
  const start = Date.now();

  // Log when response is sent
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    if (duration > 1000) {
      console.warn(`🐌 SLOW REQUEST: ${label} - ${duration}ms - ${res.statusCode}`);
    } else if (duration > 500) {
      console.log(`⏱️  ${label} - ${duration}ms - ${res.statusCode}`);
    } else {
      console.log(`✓ ${label} - ${duration}ms - ${res.statusCode}`);
    }
  });

  next();
}

module.exports = { monitor, performanceMiddleware };

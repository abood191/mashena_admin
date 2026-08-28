class DriverLocationStore {
  constructor() {
    this.drivers = new Map(); // driverId -> { lat, lng, bearing, speed, lastUpdated }
    this.listeners = new Map(); // driverId -> Set of callbacks
    this.listListeners = new Set(); // Callbacks listening to the list of active driver IDs
  }

  // Set/update driver location info
  updateLocation(driverId, data) {
     // console.log("STORE UPDATE", driverId, data);
    const existing = this.drivers.get(driverId);
    
    // Smooth bearing fallback - calculate it geographically if backend omits it
    let bearing = data.bearing;
    if (bearing === undefined || bearing === null) {
      if (existing && existing.latitude && data.latitude) {
        const lat1 = existing.latitude;
        const lng1 = existing.longitude;
        const lat2 = data.latitude;
        const lng2 = data.longitude;
        
        const dy = lat2 - lat1;
        const dx = Math.cos((Math.PI / 180) * lat1) * (lng2 - lng1);
        const distSq = dx * dx + dy * dy;
        
        // If they moved enough (approx > 0.1 meters) to avoid GPS jitter spin
        if (distSq > 0.000000000001) {
          let angle = (Math.atan2(dx, dy) * 180) / Math.PI;
          if (angle < 0) angle += 360;
          bearing = angle;
        } else {
          bearing = existing.bearing || 0;
        }
      } else {
        bearing = existing?.bearing || 0;
      }
    }

    const updated = {
      ...data,
      bearing,
      lastUpdated: Date.now(),
    };

    this.drivers.set(driverId, updated);

    // Notify individual subscribers of this driver
    if (this.listeners.has(driverId)) {
      this.listeners.get(driverId).forEach((cb) => cb(updated));
    }

    // If it's a newly spawned driver, notify active list subscribers
    if (!existing) {
      this.notifyListListeners();
    }
  }

  // Remove a driver (e.g. went offline)
  removeDriver(driverId) {
    if (this.drivers.has(driverId)) {
      this.drivers.delete(driverId);
      
      // Notify list subscribers
      this.notifyListListeners();
      
      // Notify individual driver marker that they are gone
      if (this.listeners.has(driverId)) {
        this.listeners.get(driverId).forEach((cb) => cb(null));
      }
    }
  }

  // Get current location info synchronously
  getLocation(driverId) {
    return this.drivers.get(driverId) || null;
  }

  // Get list of all currently active driver IDs
  getActiveDriverIds() {
    return Array.from(this.drivers.keys());
  }

  // Clear everything
  clear() {
    this.drivers.clear();
    
    // Notify all individual listeners that their driver is gone
    this.listeners.forEach((subscribers) => {
      subscribers.forEach((cb) => cb(null));
    });

    this.notifyListListeners();
  }

  // Subscribe to changes for a specific driver
  subscribe(driverId, callback) {
    if (!this.listeners.has(driverId)) {
      this.listeners.set(driverId, new Set());
    }
    this.listeners.get(driverId).add(callback);

    // Immediate callback with current value
    callback(this.getLocation(driverId));

    return () => {
      const set = this.listeners.get(driverId);
      if (set) {
        set.delete(callback);
        if (set.size === 0) {
          this.listeners.delete(driverId);
        }
      }
    };
  }

  // Subscribe to updates regarding the list of active driver IDs
  subscribeToList(callback) {
    this.listListeners.add(callback);
    callback(this.getActiveDriverIds());

    return () => {
      this.listListeners.delete(callback);
    };
  }

  notifyListListeners() {
    const list = this.getActiveDriverIds();
    this.listListeners.forEach((cb) => cb(list));
  }
}

export const driverLocationStore = new DriverLocationStore();

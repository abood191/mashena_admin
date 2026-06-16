class DriverLocationStore {
  constructor() {
    this.drivers = new Map(); // driverId -> { lat, lng, bearing, speed, lastUpdated }
    this.listeners = new Map(); // driverId -> Set of callbacks
    this.listListeners = new Set(); // Callbacks listening to the list of active driver IDs
  }

  // Set/update driver location info
  updateLocation(driverId, data) {
     console.log("STORE UPDATE", driverId, data);
    const existing = this.drivers.get(driverId);
    
    // Smooth bearing fallback
    let bearing = data.bearing ?? 0;
    if (existing && data.bearing === undefined) {
      bearing = existing.bearing;
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

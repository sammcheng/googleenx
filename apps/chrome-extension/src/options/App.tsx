import React, { useState, useEffect } from 'react';
import { Save, Bell, DollarSign, Car, MapPin, Settings, Globe } from 'lucide-react';
import { STORAGE_KEYS } from '@/shared/extension';

interface DeliveryPreferences {
  defaultCurrency: string;
  preferredPlatforms: string[];
  mpg: number;
  gasPrice: number;
  priceAlerts: boolean;
  notifications: boolean;
  autoCompare: boolean;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

const App: React.FC = () => {
  const [preferences, setPreferences] = useState<DeliveryPreferences>({
    defaultCurrency: 'USD',
    preferredPlatforms: [],
    mpg: 25,
    gasPrice: 3.50,
    priceAlerts: true,
    notifications: true,
    autoCompare: false,
    location: {
      latitude: 0,
      longitude: 0,
      address: 'No location saved',
    },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [locationMessage, setLocationMessage] = useState('');

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const result = await chrome.storage.sync.get([STORAGE_KEYS.deliveryPreferences]);
      if (result[STORAGE_KEYS.deliveryPreferences]) {
        setPreferences(result[STORAGE_KEYS.deliveryPreferences]);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    if (navigator.geolocation) {
      setLocationMessage('Requesting current location...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setPreferences(prev => ({
            ...prev,
            location: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              address: `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`,
            },
          }));
          setLocationMessage('Current location saved in settings. Click Save to keep it.');
        },
        (error) => {
          console.error('Geolocation error:', error);
          setLocationMessage('Location access was unavailable. You can still use the extension without it.');
        }
      );
    } else {
      setLocationMessage('This browser does not support geolocation for the settings page.');
    }
  };

  const savePreferences = async () => {
    setIsSaving(true);
    try {
      await Promise.all([
        chrome.storage.sync.set({ [STORAGE_KEYS.deliveryPreferences]: preferences }),
        chrome.storage.local.set({
          [STORAGE_KEYS.userPreferences]: {
            mpg: preferences.mpg,
            gasPrice: preferences.gasPrice,
            preferredPlatforms: preferences.preferredPlatforms,
            includeGasCalculation: true,
            showPickupOnly: true,
            showDeliveryOnly: true,
            currency: preferences.defaultCurrency,
            location:
              preferences.location.latitude !== 0 || preferences.location.longitude !== 0
                ? {
                    latitude: preferences.location.latitude,
                    longitude: preferences.location.longitude,
                  }
                : undefined,
          },
        }),
      ]);
      setSaveMessage('Settings saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Error saving preferences:', error);
      setSaveMessage('Failed to save settings');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePlatformToggle = (platformId: string) => {
    setPreferences(prev => ({
      ...prev,
      preferredPlatforms: prev.preferredPlatforms.includes(platformId)
        ? prev.preferredPlatforms.filter(id => id !== platformId)
        : [...prev.preferredPlatforms, platformId]
    }));
  };

  const availablePlatforms = [
    { id: 'doordash', name: 'DoorDash', color: '#FF3008' },
    { id: 'ubereats', name: 'Uber Eats', color: '#06C167' },
    { id: 'grubhub', name: 'Grubhub', color: '#F63440' },
    { id: 'seamless', name: 'Seamless', color: '#F63440' },
    { id: 'postmates', name: 'Postmates', color: '#000000' },
  ];

  if (isLoading) {
    return (
      <div className="app">
        <div className="loading">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <Settings size={24} />
            <h1>Delivery Settings</h1>
          </div>
          <button
            onClick={savePreferences}
            disabled={isSaving}
            className="save-btn"
          >
            <Save size={16} />
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </header>

      {saveMessage && (
        <div className={`save-message ${saveMessage.includes('success') ? 'success' : 'error'}`}>
          {saveMessage}
        </div>
      )}

      <div className="settings-content">
        <section className="setting-section">
          <div className="setting-header">
            <DollarSign size={20} />
            <h2>Currency & Pricing</h2>
          </div>
          <div className="setting-content">
            <div className="form-group">
              <label>Default Currency</label>
              <select
                value={preferences.defaultCurrency}
                onChange={(e) => setPreferences(prev => ({ ...prev, defaultCurrency: e.target.value }))}
                className="currency-select"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD (C$)</option>
              </select>
            </div>
          </div>
        </section>

        <section className="setting-section">
          <div className="setting-header">
            <Car size={20} />
            <h2>Vehicle Settings</h2>
          </div>
          <div className="setting-content">
            <div className="form-row">
              <div className="form-group">
                <label>Miles per Gallon (MPG)</label>
                <input
                  type="number"
                  value={preferences.mpg}
                  onChange={(e) => setPreferences(prev => ({ ...prev, mpg: parseFloat(e.target.value) || 25 }))}
                  min="10"
                  max="100"
                  className="number-input"
                />
                <p className="help-text">Used to calculate pickup vs delivery costs</p>
              </div>
              
              <div className="form-group">
                <label>Gas Price (per gallon)</label>
                <input
                  type="number"
                  step="0.01"
                  value={preferences.gasPrice}
                  onChange={(e) => setPreferences(prev => ({ ...prev, gasPrice: parseFloat(e.target.value) || 3.50 }))}
                  min="1"
                  max="10"
                  className="number-input"
                />
                <p className="help-text">Current gas price for cost calculations</p>
              </div>
            </div>
          </div>
        </section>

        <section className="setting-section">
          <div className="setting-header">
            <MapPin size={20} />
            <h2>Location</h2>
          </div>
          <div className="setting-content">
            <div className="location-info">
              <p><strong>Current Location:</strong> {preferences.location.address}</p>
              <button onClick={getCurrentLocation} className="location-btn">
                Use Current Location
              </button>
            </div>
            <p className="help-text">
              Location is optional. Only capture it if you want more relevant comparisons and gas estimates.
            </p>
            {locationMessage && <p className="help-text">{locationMessage}</p>}
          </div>
        </section>

        <section className="setting-section">
          <div className="setting-header">
            <Car size={20} />
            <h2>Preferred Platforms</h2>
          </div>
          <div className="setting-content">
            <p className="setting-description">
              Select your preferred delivery platforms for price comparisons
            </p>
            <div className="platform-list">
              {availablePlatforms.map(platform => (
                <label key={platform.id} className="platform-item">
                  <input
                    type="checkbox"
                    checked={preferences.preferredPlatforms.includes(platform.id)}
                    onChange={() => handlePlatformToggle(platform.id)}
                  />
                  <div 
                    className="platform-logo" 
                    style={{ backgroundColor: platform.color }}
                  >
                    {platform.name.charAt(0)}
                  </div>
                  <span>{platform.name}</span>
                </label>
              ))}
            </div>
          </div>
        </section>

        <section className="setting-section">
          <div className="setting-header">
            <Bell size={20} />
            <h2>Notifications & Automation</h2>
          </div>
          <div className="setting-content">
            <div className="toggle-group">
              <label className="toggle-item">
                <input
                  type="checkbox"
                  checked={preferences.autoCompare}
                  onChange={(e) => setPreferences(prev => ({ ...prev, autoCompare: e.target.checked }))}
                />
                <span>Auto-compare on checkout pages</span>
                <p>Off by default. Turn this on only if you want checkout pages compared automatically.</p>
              </label>
              
              <label className="toggle-item">
                <input
                  type="checkbox"
                  checked={preferences.priceAlerts}
                  onChange={(e) => setPreferences(prev => ({ ...prev, priceAlerts: e.target.checked }))}
                />
                <span>Price alerts</span>
                <p>Get notified when better deals are available</p>
              </label>
              
              <label className="toggle-item">
                <input
                  type="checkbox"
                  checked={preferences.notifications}
                  onChange={(e) => setPreferences(prev => ({ ...prev, notifications: e.target.checked }))}
                />
                <span>General notifications</span>
                <p>Receive updates about the extension and new features</p>
              </label>
            </div>
          </div>
        </section>

        <section className="setting-section">
          <div className="setting-header">
            <Globe size={20} />
            <h2>About</h2>
          </div>
          <div className="setting-content">
            <p className="about-text">
              Food Delivery Price Comparison helps you find the best deals across 
              DoorDash, Uber Eats, Grubhub, and other delivery platforms. Compare 
              prices, delivery fees, and total costs to save money on every order.
            </p>
            <div className="version-info">
              <span>Version 1.0.0</span>
              <span>•</span>
              <span>Save money on every delivery</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default App;

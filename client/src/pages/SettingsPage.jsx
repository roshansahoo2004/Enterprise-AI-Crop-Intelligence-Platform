import React, { useState } from 'react';
import PageContainer from '../components/ui/PageContainer';
import PageHeader from '../components/ui/PageHeader';
import SectionCard from '../components/ui/SectionCard';
import ActionButton from '../components/ui/ActionButton';
import { notify } from '../utils/toast';
import { FiSettings, FiBell, FiShield, FiGlobe, FiSave, FiMoon, FiDatabase } from 'react-icons/fi';

const SettingsPage = () => {
  const [settings, setSettings] = useState({
    weatherAlerts: true,
    diseaseScanAlerts: true,
    emailNotifications: false,
    autoReloadModels: true,
    units: 'metric',
    theme: 'dark'
  });
  const [loading, setLoading] = useState(false);

  const toggleSetting = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      notify.success('System preferences saved successfully!');
    }, 600);
  };

  return (
    <PageContainer>
      <PageHeader
        title="Application Settings"
        subtitle="Customize your platform preferences, alert subscriptions, and MLOps telemetry parameters."
        icon={FiSettings}
      />

      <form onSubmit={handleSave} className="space-y-8 max-w-4xl">
        <SectionCard className="p-8">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
            <FiBell className="w-5 h-5 text-primary-400" />
            <div>
              <h3 className="text-lg font-bold font-display text-white">Notification Subscriptions</h3>
              <p className="text-xs text-gray-400">Manage real-time push and system alert preferences.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-surface-900/60 border border-white/5">
              <div>
                <p className="text-sm font-semibold text-white">Severe Weather Alerts</p>
                <p className="text-xs text-gray-400">Receive instant push notifications for frost, heatwave, or heavy rain warnings.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.weatherAlerts}
                onChange={() => toggleSetting('weatherAlerts')}
                className="w-5 h-5 accent-primary-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-surface-900/60 border border-white/5">
              <div>
                <p className="text-sm font-semibold text-white">Disease Diagnostic Results</p>
                <p className="text-xs text-gray-400">Notify when image pathology classification finishes.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.diseaseScanAlerts}
                onChange={() => toggleSetting('diseaseScanAlerts')}
                className="w-5 h-5 accent-primary-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-surface-900/60 border border-white/5">
              <div>
                <p className="text-sm font-semibold text-white">Daily Digest Emails</p>
                <p className="text-xs text-gray-400">Send daily email summaries of yield predictions and soil metrics.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={() => toggleSetting('emailNotifications')}
                className="w-5 h-5 accent-primary-500 cursor-pointer"
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard className="p-8">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
            <FiDatabase className="w-5 h-5 text-primary-400" />
            <div>
              <h3 className="text-lg font-bold font-display text-white">MLOps & Operational Preferences</h3>
              <p className="text-xs text-gray-400">Configure model hot-reloading and unit system formats.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-mono text-gray-300 mb-2">Measurement Units</label>
              <select
                value={settings.units}
                onChange={(e) => setSettings({ ...settings, units: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-900 border border-white/10 text-sm text-white focus:outline-none focus:border-primary-500"
              >
                <option value="metric">Metric (°C, Hectares, mm)</option>
                <option value="imperial">Imperial (°F, Acres, inches)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-300 mb-2">Interface Theme Mode</label>
              <select
                value={settings.theme}
                onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-900 border border-white/10 text-sm text-white focus:outline-none focus:border-primary-500"
              >
                <option value="dark">Enterprise Dark Glass (Default)</option>
                <option value="system">Follow Operating System</option>
              </select>
            </div>
          </div>
        </SectionCard>

        <div className="flex justify-end pt-2">
          <ActionButton
            type="submit"
            loading={loading}
            icon={FiSave}
            label="Save Preference Settings"
          />
        </div>
      </form>
    </PageContainer>
  );
};

export default SettingsPage;

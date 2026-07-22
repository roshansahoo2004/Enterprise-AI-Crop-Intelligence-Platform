import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import PageContainer from '../components/ui/PageContainer';
import PageHeader from '../components/ui/PageHeader';
import SectionCard from '../components/ui/SectionCard';
import ActionButton from '../components/ui/ActionButton';
import { notify } from '../utils/toast';
import { 
  FiUser, FiMail, FiShield, FiMapPin, FiCalendar, 
  FiCrop, FiMaximize2, FiLayers, FiEdit3, FiSave, FiX 
} from 'react-icons/fi';

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    locationName: user?.location?.name || 'Punjab, India',
    preferredCrop: user?.preferredCrop || 'Wheat',
    farmSize: user?.farmSize || '5.2 Hectares',
    soilType: user?.soilType || 'Loamy Soil'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile(formData);
      notify.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      notify.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const joinedDateStr = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'July 2026';

  return (
    <PageContainer>
      <PageHeader
        title="User Profile"
        subtitle="Manage your personal account, farm operational parameters, and system credentials."
        icon={FiUser}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card Header */}
        <SectionCard className="lg:col-span-1 flex flex-col items-center text-center p-8">
          <div className="relative mb-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-3xl font-bold font-display shadow-xl shadow-primary-500/20 border-2 border-white/20">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <span className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-surface-900" title="Active Account"></span>
          </div>

          <h2 className="text-xl font-bold font-display text-white">{user?.name || 'User'}</h2>
          <p className="text-xs font-mono text-gray-400 mt-1">{user?.email}</p>
          
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-xs font-mono capitalize">
            <FiShield className="w-3.5 h-3.5" />
            {user?.role || 'Farmer'} Role
          </div>

          <div className="w-full border-t border-white/10 my-6"></div>

          <div className="w-full space-y-3 text-left">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-gray-400 flex items-center gap-2">
                <FiCalendar className="text-primary-400" /> Joined Date
              </span>
              <span className="text-gray-200">{joinedDateStr}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-gray-400 flex items-center gap-2">
                <FiMapPin className="text-primary-400" /> Location
              </span>
              <span className="text-gray-200">{user?.location?.name || 'Punjab, India'}</span>
            </div>
          </div>
        </SectionCard>

        {/* Profile Details & Form */}
        <SectionCard className="lg:col-span-2 p-8">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
            <div>
              <h3 className="text-lg font-bold font-display text-white">Account & Farm Details</h3>
              <p className="text-xs text-gray-400">View and update your personal and agricultural specifications.</p>
            </div>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="btn-primary py-2 px-4 rounded-xl text-xs font-mono font-bold flex items-center gap-2"
              >
                <FiEdit3 className="w-4 h-4" /> Edit Profile
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(false)}
                className="bg-surface-800 text-gray-300 hover:bg-surface-700 border border-white/10 py-2 px-4 rounded-xl text-xs font-mono font-bold flex items-center gap-2"
              >
                <FiX className="w-4 h-4" /> Cancel
              </button>
            )}
          </div>

          {!isEditing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-4 rounded-xl bg-surface-900/60 border border-white/5 space-y-1">
                <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FiUser className="text-primary-400" /> Full Name
                </label>
                <p className="text-sm font-semibold text-white">{user?.name}</p>
              </div>

              <div className="p-4 rounded-xl bg-surface-900/60 border border-white/5 space-y-1">
                <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FiMail className="text-primary-400" /> Email Address
                </label>
                <p className="text-sm font-semibold text-white">{user?.email}</p>
              </div>

              <div className="p-4 rounded-xl bg-surface-900/60 border border-white/5 space-y-1">
                <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FiMapPin className="text-primary-400" /> Farm Region / Location
                </label>
                <p className="text-sm font-semibold text-white">{user?.location?.name || 'Punjab, India'}</p>
              </div>

              <div className="p-4 rounded-xl bg-surface-900/60 border border-white/5 space-y-1">
                <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FiCrop className="text-primary-400" /> Primary Preferred Crop
                </label>
                <p className="text-sm font-semibold text-white">{user?.preferredCrop || 'Wheat'}</p>
              </div>

              <div className="p-4 rounded-xl bg-surface-900/60 border border-white/5 space-y-1">
                <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FiMaximize2 className="text-primary-400" /> Farm Operational Size
                </label>
                <p className="text-sm font-semibold text-white">{user?.farmSize || '5.2 Hectares'}</p>
              </div>

              <div className="p-4 rounded-xl bg-surface-900/60 border border-white/5 space-y-1">
                <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FiLayers className="text-primary-400" /> Dominant Soil Type
                </label>
                <p className="text-sm font-semibold text-white">{user?.soilType || 'Loamy Soil'}</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-mono text-gray-300 mb-2">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-900 border border-white/10 text-sm text-white focus:outline-none focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-300 mb-2">Location / Region</label>
                  <input
                    type="text"
                    name="locationName"
                    value={formData.locationName}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-900 border border-white/10 text-sm text-white focus:outline-none focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-300 mb-2">Preferred Crop</label>
                  <input
                    type="text"
                    name="preferredCrop"
                    value={formData.preferredCrop}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-900 border border-white/10 text-sm text-white focus:outline-none focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-300 mb-2">Farm Size</label>
                  <input
                    type="text"
                    name="farmSize"
                    value={formData.farmSize}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-900 border border-white/10 text-sm text-white focus:outline-none focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-300 mb-2">Soil Type</label>
                  <select
                    name="soilType"
                    value={formData.soilType}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-900 border border-white/10 text-sm text-white focus:outline-none focus:border-primary-500"
                  >
                    <option value="Loamy Soil">Loamy Soil</option>
                    <option value="Clay Soil">Clay Soil</option>
                    <option value="Sandy Soil">Sandy Soil</option>
                    <option value="Black Soil">Black Soil</option>
                    <option value="Alluvial Soil">Alluvial Soil</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-5 py-2.5 rounded-xl bg-surface-800 text-gray-300 hover:bg-surface-700 border border-white/10 text-xs font-mono font-bold"
                >
                  Cancel
                </button>
                <ActionButton
                  type="submit"
                  loading={loading}
                  icon={FiSave}
                  label="Save Profile Changes"
                />
              </div>
            </form>
          )}
        </SectionCard>
      </div>
    </PageContainer>
  );
};

export default ProfilePage;

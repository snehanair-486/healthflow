import { useState, useEffect } from 'react';
import { profileAPI } from '../api';

export function useProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    profileAPI.get().then(r => {
      setProfile(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const saveProfile = async (data) => {
    const r = await profileAPI.save(data);
    setProfile(r.data);
    return r.data;
  };

  const recommendedWater = profile?.weight_kg
    ? Math.round(profile.weight_kg * 35 * ({ sedentary: 1, light: 1.1, moderate: 1.2, active: 1.4, very_active: 1.6 }[profile.activity_level] || 1.2))
    : 2000;

  const bmi = profile?.weight_kg && profile?.height_cm
    ? (profile.weight_kg / ((profile.height_cm / 100) ** 2)).toFixed(1)
    : null;

  return { profile, loading, saveProfile, recommendedWater, bmi };
}
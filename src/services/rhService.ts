import { supabase } from '../lib/supabase';

export type RhProfile = {
  id: string;
  name: string;
  role: string;
  type: 'CLT' | 'PJ' | 'Freelancer' | 'Sócio';
  costPerHour: number;
  costPerDay: number;
  phone: string;
  email: string;
  pix: string;
  skills: string[];
  avatar: string;
};

export async function fetchRhProfiles(): Promise<RhProfile[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('rh_profiles').select('*').order('name');
  if (error) throw new Error(`[rhService] fetchRhProfiles: ${error.message}`);
  
  return (data || []).map(r => ({
    id: r.id,
    name: r.name,
    role: r.role,
    type: r.type_contract || 'Freelancer',
    costPerHour: r.cost_per_hour || 0,
    costPerDay: r.cost_per_day || 0,
    phone: r.phone || '',
    email: r.email || '',
    pix: r.pix_key || '',
    skills: r.skills || [],
    avatar: r.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(r.name)}&background=random`
  }));
}

export async function createRhProfile(profile: Omit<RhProfile, 'id'>): Promise<RhProfile> {
  if (!supabase) throw new Error('Supabase not connected');
  const { data, error } = await supabase.from('rh_profiles').insert({
    name: profile.name,
    role: profile.role,
    type_contract: profile.type,
    cost_per_hour: profile.costPerHour,
    cost_per_day: profile.costPerDay,
    phone: profile.phone,
    email: profile.email,
    pix_key: profile.pix,
    skills: profile.skills,
    avatar_url: profile.avatar
  }).select().single();

  if (error) throw new Error(`[rhService] createRhProfile: ${error.message}`);
  const r = data;
  return {
    id: r.id,
    name: r.name,
    role: r.role,
    type: r.type_contract,
    costPerHour: r.cost_per_hour,
    costPerDay: r.cost_per_day,
    phone: r.phone,
    email: r.email,
    pix: r.pix_key,
    skills: r.skills,
    avatar: r.avatar_url
  };
}

export async function deleteRhProfile(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('rh_profiles').delete().eq('id', id);
  if (error) throw new Error(`[rhService] deleteRhProfile: ${error.message}`);
}

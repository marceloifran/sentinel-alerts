import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

export interface UserWithRole {
    id: string;
    email: string;
    name: string;
    role: AppRole;
    created_at: string;
}

export const roleLabels: Record<AppRole, string> = {
    admin: 'Administrador',
    responsable: 'Responsable',
};

export const roleIcons: Record<AppRole, string> = {
    admin: '👑',
    responsable: '👤',
};

export async function getAllUsers(): Promise<UserWithRole[]> {
    // Get all profiles
    const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, name, created_at')
        .order('created_at', { ascending: false });

    if (profilesError) throw profilesError;
    if (!profiles || profiles.length === 0) return [];

    // Get all user roles
    const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

    if (rolesError) throw rolesError;

    // Create a map of user_id -> role
    const roleMap = new Map((roles || []).map(r => [r.user_id, r.role]));

    // Combine profiles with roles
    return profiles.map(profile => ({
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: roleMap.get(profile.id) || 'responsable',
        created_at: profile.created_at,
    }));
}

export async function getUserRole(userId: string): Promise<AppRole | null> {
    const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

    if (error) throw error;
    return data?.role || null;
}

export async function updateUserRole(
    userId: string,
    newRole: AppRole,
    currentUserId: string
): Promise<void> {
    // Check if the current user is an admin
    const { data: currentUserRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', currentUserId)
        .maybeSingle();

    if (currentUserRole?.role !== 'admin') {
        throw new Error('Solo los administradores pueden cambiar roles');
    }

    // Prevent removing the last admin
    if (newRole === 'responsable') {
        const { data: adminCount } = await supabase
            .from('user_roles')
            .select('user_id', { count: 'exact' })
            .eq('role', 'admin');

        if ((adminCount?.length || 0) <= 1) {
            const { data: isLastAdmin } = await supabase
                .from('user_roles')
                .select('user_id')
                .eq('user_id', userId)
                .eq('role', 'admin')
                .maybeSingle();

            if (isLastAdmin) {
                throw new Error('No puedes remover el último administrador');
            }
        }
    }

    // Update the role
    const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

    if (deleteError) throw deleteError;

    const { error: insertError } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: newRole });

    if (insertError) throw insertError;
}

export async function inviteUser(
    email: string,
    name: string,
    role: AppRole
): Promise<{ success: boolean; message: string }> {
    // Check if user already exists
    const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

    if (existingUser) {
        return {
            success: false,
            message: 'Este usuario ya está registrado',
        };
    }

    // In a real app, you would send an invitation email here
    // For now, we'll return a success message with instructions
    return {
        success: true,
        message: `Invitación lista para ${email}. El usuario debe registrarse con este email.`,
    };
}

export type { AppRole };

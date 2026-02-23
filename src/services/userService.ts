import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { Shield, Eye } from 'lucide-react';
import { sendInvitationEmail } from './emailService';

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

export const roleIcons: Record<AppRole, any> = {
    admin: Shield,
    responsable: Eye,
};

export async function getAllUsers(): Promise<UserWithRole[]> {
    // Get current user ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Get invitations made by the current user that have been accepted
    const { data: invitations, error: invitationsError } = await supabase
        .from('user_invitations')
        .select('invited_user_id, invited_email')
        .eq('invited_by', user.id)
        .eq('status', 'accepted')
        .not('invited_user_id', 'is', null);

    if (invitationsError) throw invitationsError;

    // Get the invited user IDs
    const invitedUserIds = (invitations || [])
        .map(inv => inv.invited_user_id)
        .filter((id): id is string => id !== null);

    // Always include the current user
    const allUserIds = [...new Set([user.id, ...invitedUserIds])];

    if (allUserIds.length === 0) return [];

    // Get profiles for these users
    const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, name, created_at')
        .in('id', allUserIds)
        .order('created_at', { ascending: false });

    if (profilesError) throw profilesError;
    if (!profiles || profiles.length === 0) return [];

    // Get all user roles for these users
    const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', allUserIds);

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

export async function getPendingInvitations(): Promise<{ email: string; created_at: string }[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('user_invitations')
        .select('invited_email, created_at')
        .eq('invited_by', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(inv => ({
        email: inv.invited_email,
        created_at: inv.created_at
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, message: 'No estás autenticado' };
    }

    // Check plan limits before inviting
    const { data: profile } = await supabase
        .from('profiles')
        .select('max_users')
        .eq('id', user.id)
        .single();

    if (profile && profile.max_users !== -1) {
        // Count current team members (accepted invitations + current user)
        const { count: acceptedCount } = await supabase
            .from('user_invitations')
            .select('*', { count: 'exact', head: true })
            .eq('invited_by', user.id)
            .eq('status', 'accepted');

        const currentTeamSize = (acceptedCount || 0) + 1; // +1 for the admin themselves

        if (currentTeamSize >= profile.max_users) {
            return {
                success: false,
                message: `Has alcanzado el límite de ${profile.max_users} usuarios de tu plan. Actualiza tu plan para invitar más usuarios.`,
            };
        }
    }

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

    // Check if invitation already exists
    const { data: existingInvitation } = await supabase
        .from('user_invitations')
        .select('id')
        .eq('invited_email', email)
        .eq('invited_by', user.id)
        .eq('status', 'pending')
        .maybeSingle();

    if (existingInvitation) {
        return {
            success: false,
            message: 'Ya existe una invitación pendiente para este email',
        };
    }

    // Create the invitation
    const { error } = await supabase
        .from('user_invitations')
        .insert({
            invited_by: user.id,
            invited_email: email,
            status: 'pending'
        });

    if (error) {
        console.error('Error creating invitation:', error);
        return {
            success: false,
            message: 'Error al crear la invitación',
        };
    }

    // Send the email (awaiting it now to catch errors)
    const { data: adminProfile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .maybeSingle();

    try {
        console.log(`📧 Intentando enviar invitación a ${email}...`);
        await sendInvitationEmail({
            to: email,
            userName: name,
            invitedBy: adminProfile?.name || user.email || 'Un administrador',
            inviteLink: `${window.location.origin}/auth`
        });
        console.log('✅ Correo de invitación enviado exitosamente');
    } catch (err) {
        console.error('❌ Error enviando email de invitación:', err);
        // We still return success: true because the invitation IS in the database,
        // but we notify the user that the email failed.
        return {
            success: true,
            message: `Invitación guardada para ${email}, pero hubo un error al enviar el correo. El usuario puede registrarse directamente con este email.`,
        };
    }

    return {
        success: true,
        message: `Invitación enviada a ${email}. El usuario debe registrarse con este email para unirse.`,
    };
}

export async function deleteInvitation(email: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No estás autenticado');

    const { error } = await supabase
        .from('user_invitations')
        .delete()
        .eq('invited_email', email)
        .eq('invited_by', user.id)
        .eq('status', 'pending');

    if (error) {
        console.error('Error deleting invitation:', error);
        throw error;
    }
}

export type { AppRole };

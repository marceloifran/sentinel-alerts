import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')!;
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

interface GoogleCalendarIntegration {
  user_id: string;
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
  selected_calendar_id: string;
  sync_enabled: boolean;
}

async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh token: ${error}`);
  }

  return response.json();
}

async function getValidAccessToken(
  supabase: SupabaseClient,
  userId: string
): Promise<{ accessToken: string; calendarId: string } | null> {
  const { data: integration, error } = await supabase
    .from('google_calendar_integrations')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !integration) return null;

  const typedIntegration = integration as GoogleCalendarIntegration;
  const now = new Date();
  const expiresAt = new Date(typedIntegration.token_expires_at);

  let accessToken = typedIntegration.access_token;

  // Refresh if token expires in less than 5 minutes
  if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
    try {
      const tokens = await refreshAccessToken(typedIntegration.refresh_token);
      accessToken = tokens.access_token;

      const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);

      await supabase
        .from('google_calendar_integrations')
        .update({
          access_token: accessToken,
          token_expires_at: newExpiresAt.toISOString(),
        } as Record<string, unknown>)
        .eq('user_id', userId);
    } catch (err) {
      console.error('Error refreshing token:', err);
      return null;
    }
  }

  return { accessToken, calendarId: typedIntegration.selected_calendar_id || 'primary' };
}

async function createCalendarEvent(
  accessToken: string,
  calendarId: string,
  obligation: {
    id: string;
    name: string;
    due_date: string;
    status: string;
    responsible_name?: string;
    notes?: string;
  },
  appUrl: string
): Promise<string> {
  const statusLabels: Record<string, string> = {
    al_dia: '✅ Al día',
    por_vencer: '⚠️ Por vencer',
    vencida: '❌ Vencida',
  };

  const description = `Estado: ${statusLabels[obligation.status] || obligation.status}
Responsable: ${obligation.responsible_name || 'No asignado'}
${obligation.notes ? `\nNotas: ${obligation.notes}` : ''}

🔗 Ver en IfsinRem: ${appUrl}/obligaciones/${obligation.id}`;

  const event = {
    summary: `IfsinRem: ${obligation.name}`,
    description,
    start: {
      date: obligation.due_date,
    },
    end: {
      date: obligation.due_date,
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 1440 }, // 1 day before
        { method: 'popup', minutes: 0 }, // On the day
      ],
    },
  };

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create event: ${error}`);
  }

  const data = await response.json();
  return data.id;
}

async function updateCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
  obligation: {
    id: string;
    name: string;
    due_date: string;
    status: string;
    responsible_name?: string;
    notes?: string;
  },
  appUrl: string
): Promise<void> {
  const statusLabels: Record<string, string> = {
    al_dia: '✅ Al día',
    por_vencer: '⚠️ Por vencer',
    vencida: '❌ Vencida',
  };

  const description = `Estado: ${statusLabels[obligation.status] || obligation.status}
Responsable: ${obligation.responsible_name || 'No asignado'}
${obligation.notes ? `\nNotas: ${obligation.notes}` : ''}

🔗 Ver en IfsinRem: ${appUrl}/obligaciones/${obligation.id}`;

  const event = {
    summary: `IfsinRem: ${obligation.name}`,
    description,
    start: {
      date: obligation.due_date,
    },
    end: {
      date: obligation.due_date,
    },
  };

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update event: ${error}`);
  }
  await response.text();
}

async function deleteCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventId: string
): Promise<void> {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok && response.status !== 404) {
    const error = await response.text();
    throw new Error(`Failed to delete event: ${error}`);
  }
  await response.text().catch(() => { });
}

async function listCalendars(accessToken: string): Promise<{ id: string; summary: string }[]> {
  const response = await fetch(
    'https://www.googleapis.com/calendar/v3/users/me/calendarList',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to list calendars: ${error}`);
  }

  const data = await response.json();
  return data.items
    .filter((cal: { accessRole: string }) => cal.accessRole === 'owner' || cal.accessRole === 'writer')
    .map((cal: { id: string; summary: string }) => ({
      id: cal.id,
      summary: cal.summary,
    }));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = claimsData.claims.sub as string;
    const { action, ...params } = await req.json();

    switch (action) {
      case 'get-auth-url': {
        const { redirectUri } = params;
        const scopes = [
          'https://www.googleapis.com/auth/calendar.events',
          'https://www.googleapis.com/auth/calendar.readonly',
        ];
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
          `client_id=${GOOGLE_CLIENT_ID}` +
          `&redirect_uri=${encodeURIComponent(redirectUri)}` +
          `&response_type=code` +
          `&scope=${encodeURIComponent(scopes.join(' '))}` +
          `&access_type=offline` +
          `&prompt=consent`;

        return new Response(JSON.stringify({ authUrl }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'exchange-code': {
        const { code, redirectUri } = params;

        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            code,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
          }),
        });

        if (!tokenResponse.ok) {
          const error = await tokenResponse.text();
          throw new Error(`Token exchange failed: ${error}`);
        }

        const tokens: TokenResponse = await tokenResponse.json();
        const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

        // Upsert integration
        const { error: upsertError } = await supabase
          .from('google_calendar_integrations')
          .upsert({
            user_id: userId,
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            token_expires_at: expiresAt.toISOString(),
            selected_calendar_id: 'primary',
            sync_enabled: false,
          } as Record<string, unknown>, { onConflict: 'user_id' });

        if (upsertError) throw upsertError;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'list-calendars': {
        const tokenData = await getValidAccessToken(supabase, userId);
        if (!tokenData) {
          return new Response(JSON.stringify({ error: 'Not connected' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const calendars = await listCalendars(tokenData.accessToken);
        return new Response(JSON.stringify({ calendars }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'update-settings': {
        const { calendarId, syncEnabled } = params;

        const { error } = await supabase
          .from('google_calendar_integrations')
          .update({
            selected_calendar_id: calendarId,
            sync_enabled: syncEnabled,
          } as Record<string, unknown>)
          .eq('user_id', userId);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'disconnect': {
        const { error } = await supabase
          .from('google_calendar_integrations')
          .delete()
          .eq('user_id', userId);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'sync-obligation': {
        const { obligation, appUrl } = params;

        const tokenData = await getValidAccessToken(supabase, userId);
        if (!tokenData) {
          return new Response(JSON.stringify({ error: 'Not connected' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Check if sync is enabled
        const { data: integration } = await supabase
          .from('google_calendar_integrations')
          .select('sync_enabled')
          .eq('user_id', userId)
          .single();

        const typedIntegration = integration as { sync_enabled: boolean } | null;
        if (!typedIntegration?.sync_enabled) {
          return new Response(JSON.stringify({ skipped: true, reason: 'Sync disabled' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Get existing google_event_id
        const { data: existingObligation } = await supabase
          .from('obligations')
          .select('google_event_id')
          .eq('id', obligation.id)
          .single();

        const typedObligation = existingObligation as { google_event_id: string | null } | null;
        let eventId = typedObligation?.google_event_id;

        if (eventId) {
          // Update existing event
          await updateCalendarEvent(
            tokenData.accessToken,
            tokenData.calendarId,
            eventId,
            obligation,
            appUrl
          );
        } else {
          // Create new event
          eventId = await createCalendarEvent(
            tokenData.accessToken,
            tokenData.calendarId,
            obligation,
            appUrl
          );

          // Save google_event_id
          await supabase
            .from('obligations')
            .update({ google_event_id: eventId } as Record<string, unknown>)
            .eq('id', obligation.id);
        }

        return new Response(JSON.stringify({ success: true, eventId }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'delete-event': {
        const { obligationId } = params;

        const tokenData = await getValidAccessToken(supabase, userId);
        if (!tokenData) {
          return new Response(JSON.stringify({ skipped: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { data: obligation } = await supabase
          .from('obligations')
          .select('google_event_id')
          .eq('id', obligationId)
          .single();

        const typedObligation = obligation as { google_event_id: string | null } | null;
        if (typedObligation?.google_event_id) {
          await deleteCalendarEvent(
            tokenData.accessToken,
            tokenData.calendarId,
            typedObligation.google_event_id
          );
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'sync-all': {
        const { appUrl } = params;

        const tokenData = await getValidAccessToken(supabase, userId);
        if (!tokenData) {
          return new Response(JSON.stringify({ error: 'Not connected' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { data: integration } = await supabase
          .from('google_calendar_integrations')
          .select('sync_enabled')
          .eq('user_id', userId)
          .single();

        const typedIntegration = integration as { sync_enabled: boolean } | null;
        if (!typedIntegration?.sync_enabled) {
          return new Response(JSON.stringify({ error: 'Sync disabled' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Get all obligations created by user
        const { data: obligations } = await supabase
          .from('obligations')
          .select('id, name, due_date, status, notes, responsible_id, google_event_id')
          .eq('created_by', userId);

        if (!obligations) {
          return new Response(JSON.stringify({ synced: 0 }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Get responsible names
        const responsibleIds = [...new Set((obligations as { responsible_id: string }[]).map(o => o.responsible_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', responsibleIds);

        const profileMap = new Map(((profiles || []) as { id: string; name: string }[]).map(p => [p.id, p.name]));

        let synced = 0;
        for (const obl of obligations as {
          id: string;
          name: string;
          due_date: string;
          status: string;
          notes: string | null;
          responsible_id: string;
          google_event_id: string | null;
        }[]) {
          try {
            const obligationForSync = {
              id: obl.id,
              name: obl.name,
              due_date: obl.due_date,
              status: obl.status,
              responsible_name: profileMap.get(obl.responsible_id) || 'Sin asignar',
              notes: obl.notes || undefined,
            };

            if (obl.google_event_id) {
              await updateCalendarEvent(
                tokenData.accessToken,
                tokenData.calendarId,
                obl.google_event_id,
                obligationForSync,
                appUrl
              );
            } else {
              const eventId = await createCalendarEvent(
                tokenData.accessToken,
                tokenData.calendarId,
                obligationForSync,
                appUrl
              );

              await supabase
                .from('obligations')
                .update({ google_event_id: eventId } as Record<string, unknown>)
                .eq('id', obl.id);
            }
            synced++;
          } catch (err) {
            console.error(`Error syncing obligation ${obl.id}:`, err);
          }
        }

        return new Response(JSON.stringify({ success: true, synced }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get-status': {
        const { data: integration } = await supabase
          .from('google_calendar_integrations')
          .select('selected_calendar_id, sync_enabled, created_at')
          .eq('user_id', userId)
          .single();

        if (integration) {
          // Verify token is still valid
          const tokenData = await getValidAccessToken(supabase, userId);
          if (!tokenData) {
            // Token expired and can't refresh - clean up
            await supabase
              .from('google_calendar_integrations')
              .delete()
              .eq('user_id', userId);
            return new Response(JSON.stringify({ connected: false }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }

        return new Response(JSON.stringify({
          connected: !!integration,
          ...integration
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'sync-obligation': {
        const { obligation } = params;
        const tokenData = await getValidAccessToken(supabase, userId);
        if (!tokenData) {
          throw new Error('Not connected to Google Calendar');
        }

        const { data: integration } = await supabase
          .from('google_calendar_integrations')
          .select('selected_calendar_id, sync_enabled')
          .eq('user_id', userId)
          .single();

        if (!integration?.sync_enabled) {
          return new Response(JSON.stringify({ success: false, message: 'Sync disabled' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Check if event already exists
        const { data: existingObligation } = await supabase
          .from('obligations')
          .select('google_event_id')
          .eq('id', obligation.id)
          .single();

        const event = {
          summary: obligation.title,
          description: obligation.description || '',
          start: {
            dateTime: new Date(obligation.due_date).toISOString(),
            timeZone: 'America/Argentina/Buenos_Aires',
          },
          end: {
            dateTime: new Date(new Date(obligation.due_date).getTime() + 60 * 60 * 1000).toISOString(),
            timeZone: 'America/Argentina/Buenos_Aires',
          },
          colorId: getCategoryColor(obligation.category),
        };

        let eventId = existingObligation?.google_event_id;

        if (eventId) {
          // Update existing event
          const updateResponse = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${integration.selected_calendar_id}/events/${eventId}`,
            {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(event),
            }
          );

          if (!updateResponse.ok) {
            throw new Error(`Failed to update event: ${await updateResponse.text()}`);
          }
        } else {
          // Create new event
          const createResponse = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${integration.selected_calendar_id}/events`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(event),
            }
          );

          if (!createResponse.ok) {
            throw new Error(`Failed to create event: ${await createResponse.text()}`);
          }

          const createdEvent = await createResponse.json();
          eventId = createdEvent.id;

          // Save event ID
          await supabase
            .from('obligations')
            .update({ google_event_id: eventId })
            .eq('id', obligation.id);
        }

        return new Response(JSON.stringify({ success: true, eventId }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'delete-obligation': {
        const { obligationId } = params;

        // Get the Google event ID
        const { data: obligation } = await supabase
          .from('obligations')
          .select('google_event_id')
          .eq('id', obligationId)
          .single();

        if (!obligation?.google_event_id) {
          return new Response(JSON.stringify({ success: true, message: 'No event to delete' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const tokenData = await getValidAccessToken(supabase, userId);
        if (!tokenData) {
          return new Response(JSON.stringify({ success: false, message: 'Not connected' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { data: integration } = await supabase
          .from('google_calendar_integrations')
          .select('selected_calendar_id')
          .eq('user_id', userId)
          .single();

        if (!integration) {
          return new Response(JSON.stringify({ success: false, message: 'Not connected' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Delete from Google Calendar
        const deleteResponse = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${integration.selected_calendar_id}/events/${obligation.google_event_id}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${tokenData.access_token}`,
            },
          }
        );

        if (!deleteResponse.ok && deleteResponse.status !== 404) {
          console.error('Failed to delete event:', await deleteResponse.text());
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Unknown action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

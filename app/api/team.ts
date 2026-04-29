import { api } from "./store";

interface Team {
    id: string; name: string;
    description: string; created_by: string; created_at: string;
}
interface TeamWithMembers extends Team { members: Member[]; }
interface Member { id: string; team_id: string; email: string; role: string; created_at: string; }
interface CreateTeamRequest { name: string; description?: string; created_by: string | undefined; }
interface UpdateTeamRequest { name?: string; description?: string; }

export const teamsApi = api.injectEndpoints({
    endpoints: (builder) => ({

        // GET /teams
        getTeams: builder.query<Team[], void>({
            query: () => "/teams",
            providesTags: ["Team"],
        }),

        // GET /teams/:id
        getTeam: builder.query<TeamWithMembers, string>({
            query: (id) => `/teams/${id}`,
            providesTags: (result, error, id) => [{ type: "Team", id }],
        }),

        // POST /teams
        createTeam: builder.mutation<Team, CreateTeamRequest>({
            query: (body) => ({ url: "/team", method: "POST", body }),
            invalidatesTags: ["Team", "User"], // ← GET /teams refetches automatically
        }),

        // PATCH /teams/:id
        updateTeam: builder.mutation<Team, { id: string } & UpdateTeamRequest>({
            query: ({ id, ...body }) => ({ url: `/teams/${id}`, method: "PATCH", body }),
            invalidatesTags: (result, error, { id }) => [
                "Team",              // refetch list
                { type: "Team", id } // refetch this specific team
            ],
        }),

        // DELETE /teams/:id
        deleteTeam: builder.mutation<void, string>({
            query: (id) => ({ url: `/teams/${id}`, method: "DELETE" }),
            invalidatesTags: ["Team"],
        }),

        // POST /teams/:id/members
        addMember: builder.mutation<Member, { teamId: string; email: string; role: string }>({
            query: ({ teamId, ...body }) => ({ url: `/teams/${teamId}/members`, method: "POST", body }),
            invalidatesTags: (result, error, { teamId }) => [{ type: "Team", id: teamId }],
        }),

        // DELETE /teams/:id/members/:memberId
        removeMember: builder.mutation<void, { teamId: string; memberId: string }>({
            query: ({ teamId, memberId }) => ({ url: `/teams/${teamId}/members/${memberId}`, method: "DELETE" }),
            invalidatesTags: (result, error, { teamId }) => [{ type: "Team", id: teamId }],
        }),
    }),
    overrideExisting: true,
});

export const {
    useGetTeamsQuery,
    useGetTeamQuery,
    useCreateTeamMutation,
    useUpdateTeamMutation,
    useDeleteTeamMutation,
    useAddMemberMutation,
    useRemoveMemberMutation,
} = teamsApi;
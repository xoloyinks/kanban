import { api } from "./store";

interface Board { id: string; name: string; destination_id: string; }

export const boardsApi = api.injectEndpoints({
    endpoints: (builder) => ({

        getBoards: builder.query<Board[], string | void>({
            query: (destinationId) => destinationId
                ? `/boards?destination_id=${destinationId}`
                : "/boards",
            providesTags: ["Board"],
        }),

        getBoard: builder.query<Board, string>({
            query: (id) => `/boards/${id}`,
            providesTags: (result, error, id) => [{ type: "Board", id }],
        }),

        createBoard: builder.mutation<Board, { name: string; destination_id: string }>({
            query: (body) => ({ url: "/boards", method: "POST", body }),
            invalidatesTags: ["Board"], // ← board list refetches
        }),

        updateBoard: builder.mutation<Board, { id: string; name?: string }>({
            query: ({ id, ...body }) => ({ url: `/boards/${id}`, method: "PATCH", body }),
            invalidatesTags: (result, error, { id }) => ["Board", { type: "Board", id }],
        }),

        deleteBoard: builder.mutation<void, string>({
            query: (id) => ({ url: `/boards/${id}`, method: "DELETE" }),
            invalidatesTags: ["Board"],
        }),
    }),
    overrideExisting: true,
});

export const {
    useGetBoardsQuery,
    useGetBoardQuery,
    useCreateBoardMutation,
    useUpdateBoardMutation,
    useDeleteBoardMutation,
} = boardsApi;
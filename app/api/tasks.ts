import { PaginatedTasks, Task } from "@/structs/types";
import { api } from "./store";

interface TaskFilter {
    board_id: string;
    priority?: string;
    search?: string;
    page?: number;
    limit?: number;
}

export const tasksApi = api.injectEndpoints({
    endpoints: (builder) => ({

        getTasks: builder.query<PaginatedTasks, TaskFilter>({
            query: ({ board_id, priority, search, page = 1, limit = 100 }) => {
                const params = new URLSearchParams({ board_id, page: String(page), limit: String(limit) });
                if (priority) params.set("priority", priority);
                if (search)   params.set("search", search);
                return `/tasks?${params}`;
            },
            providesTags: ["Task"],
        }),

        getTask: builder.query<Task, string>({
            query: (id) => `/tasks/${id}`,
            providesTags: (result, error, id) => [{ type: "Task", id }],
        }),

        createTask: builder.mutation<Task, Partial<Task>>({
            query: (body) => ({ url: "/tasks", method: "POST", body }),
            invalidatesTags: ["Task"],
        }),

        updateTask: builder.mutation<void, { id: string } & Partial<any>>({
            query: ({ id, ...body }) => ({ url: `/tasks/${id}`, method: "PATCH", body }),
            invalidatesTags: (result, error, { id }) => ["Task", { type: "Task", id }],
        }),

        deleteTask: builder.mutation<void, string>({
            query: (id) => ({ url: `/tasks/${id}`, method: "DELETE" }),
            invalidatesTags: ["Task"],
        }),
    }),
    overrideExisting: true
});

export const {
    useGetTasksQuery,
    useGetTaskQuery,
    useCreateTaskMutation,
    useUpdateTaskMutation,
    useDeleteTaskMutation,
} = tasksApi;
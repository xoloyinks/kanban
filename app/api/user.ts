import { User } from "@/structs/types";
import { api } from "./store";

export const userApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getUser: builder.query<User, null>({
            query: () => "/user",
            providesTags: ["User"],
        }),
    }),
    overrideExisting: true,
});

export const { useGetUserQuery } = userApi;
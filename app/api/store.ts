import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const getToken = () => typeof window !== "undefined"
    ? localStorage.getItem("token") ?? ""
    : "";

export const api = createApi({
    reducerPath: "api",
    baseQuery: fetchBaseQuery({
        baseUrl: "https://task-api-5zuk.onrender.com",
        prepareHeaders: (headers) => {
            const token = getToken();
            if (token) headers.set("Authorization", `Bearer ${token}`);
            return headers;
        },
    }),
    tagTypes: ["Team", "Board", "Task", "Member", "Column", "User"],
    endpoints: () => ({}),
});
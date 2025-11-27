import { 
  createApi, 
  fetchBaseQuery,
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import type { RootState } from "../store/store";
import { clearAuth } from "../store/slices/authSlice";

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001/api',
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as RootState;
    const token = state.auth.accessToken;
    
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    console.warn("401 Unauthorized - Clearing auth state");
    
    api.dispatch(clearAuth());
    
    if (typeof window !== "undefined") {
      const currentPath = window.location.pathname;
      if (currentPath !== "/auth/login" && currentPath !== "/auth/register") {
        sessionStorage.setItem("redirectAfterLogin", currentPath);
      }
      
      if (!currentPath.startsWith("/auth")) {
        window.location.href = "/auth/login";
      }
    }
  }

  return result;
};

export const api = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Me", "Rooms", "Messages", "Admin"],
  endpoints: () => ({}),
});

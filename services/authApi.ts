import { api } from "./api";
import { setAuth, setCurrentUser, clearAuth, User } from "../store/slices/authSlice";

interface LoginRequest {
  emailOrUsername: string;
  password: string;
}

interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  displayName?: string;
}

// Backend response shape
interface RawAuthResponse {
  status: string;
  data: {
    user: User;
    accessToken: string;
  };
}

// What we store
interface AuthResponse {
  accessToken: string;
}

// /users/me response shape
interface MeRawResponse {
  status: string;
  data: {
    user: User;
  };
}

export const authApi = api.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<AuthResponse, LoginRequest>({
      query: (body) => ({
        url: "/auth/login",
        method: "POST",
        body,
      }),
      transformResponse: (response: RawAuthResponse): AuthResponse => ({
        accessToken: response.data.accessToken,
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setAuth({ accessToken: data.accessToken }));
          // Now fetch current user
          const meResult = await dispatch(authApi.endpoints.me.initiate(undefined)).unwrap();
          dispatch(setCurrentUser(meResult));
        } catch (err) {
          console.error("Login failed:", err);
        }
      },
    }),

    register: build.mutation<AuthResponse, RegisterRequest>({
      query: (body) => ({
        url: "/auth/register",
        method: "POST",
        body,
      }),
      transformResponse: (response: RawAuthResponse): AuthResponse => ({
        accessToken: response.data.accessToken,
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setAuth({ accessToken: data.accessToken }));
          // Fetch current user
          const meResult = await dispatch(authApi.endpoints.me.initiate(undefined)).unwrap();
          dispatch(setCurrentUser(meResult));
        } catch (err) {
          console.error("Registration failed:", err);
        }
      },
    }),

    me: build.query<User, void>({
      query: () => ({
        url: "/users/me",
        method: "GET",
      }),
      transformResponse: (response: MeRawResponse): User => response.data.user,
      providesTags: ["Me"],
    }),

    logout: build.mutation<void, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } finally {
          dispatch(clearAuth());
          dispatch(api.util.resetApiState());
        }
      },
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useMeQuery,
  useLogoutMutation,
} = authApi;

import api from "./client";
import type { AuthTokens } from "../types";

export const authApi = {
  register: (email: string, name: string, password: string, org_name?: string) =>
    api.post<AuthTokens>("/auth/register", { email, name, password, org_name }),

  login: (email: string, password: string) =>
    api.post<AuthTokens>("/auth/login", { email, password }),
};

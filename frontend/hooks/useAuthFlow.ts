import { useRouter } from "next/navigation";
import { api, session } from "@/lib/api";

export function useAuthFlow() {
  const router = useRouter();

  const login = async (emailOrUsername: string, password: string): Promise<void> => {
    const tokens = await api.login(emailOrUsername, password);
    session.setTokens(tokens.access_token, tokens.refresh_token);
    const user = await api.getCurrentUser(tokens.access_token);
    session.setUser(user);
    router.push("/");
  };

  const register = async (email: string, password: string, username: string): Promise<void> => {
    const tokens = await api.register(email, password, username);
    session.setTokens(tokens.access_token, tokens.refresh_token);
    const user = await api.getCurrentUser(tokens.access_token);
    session.setUser(user);
    router.push("/");
  };

  return { login, register };
}

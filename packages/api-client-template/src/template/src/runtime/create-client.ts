import type { AxiosInstance } from "axios";

export interface ClientOptions {
  readonly httpClient: AxiosInstance;
}

export function createClient({ httpClient }: ClientOptions) {
  return {
    async ping() {
      const response = await httpClient.get("/ping");
      return response.data;
    }
  };
}

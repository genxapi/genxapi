export interface HttpClient {
  get<T = unknown>(url: string): Promise<{ data: T }>;
}

export interface ClientOptions {
  readonly httpClient: HttpClient;
}

export function createClient({ httpClient }: ClientOptions) {
  return {
    async ping() {
      const response = await httpClient.get("/ping");
      return response.data;
    }
  };
}

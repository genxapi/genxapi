export interface HttpClient {
    get<T = unknown>(url: string): Promise<{
        data: T;
    }>;
}
export interface ClientOptions {
    readonly httpClient: HttpClient;
}
export declare function createClient({ httpClient }: ClientOptions): {
    ping(): Promise<unknown>;
};

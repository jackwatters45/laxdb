export interface CloudflareKvIdentityInput {
  readonly accountId: string;
  readonly namespaceId: string;
  readonly apiToken: string;
}

export interface CloudflareKvGetInput extends CloudflareKvIdentityInput {
  readonly key: string;
}

export interface CloudflareKvSetInput extends CloudflareKvIdentityInput {
  readonly key: string;
  readonly value: string;
  readonly ttlSeconds?: number;
}

export interface CloudflareKvDeleteInput extends CloudflareKvIdentityInput {
  readonly key: string;
}

export declare function cloudflareKvGet(
  input: CloudflareKvGetInput,
): Promise<string | null>;

export declare function cloudflareKvSet(
  input: CloudflareKvSetInput,
): Promise<void>;

export declare function cloudflareKvDelete(
  input: CloudflareKvDeleteInput,
): Promise<void>;

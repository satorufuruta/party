export interface D1Result<T = unknown> {
  results: T[];
}

export interface D1PreparedStatement {
  bind(...params: unknown[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  all<T = unknown>(): Promise<D1Result<T>>;
  run<T = unknown>(): Promise<T>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

export interface DatabaseEnv {
  PARTY_DB: D1Database;
}

export const getDatabase = (env: DatabaseEnv): D1Database => env.PARTY_DB;

export const placeholders = (count: number): string => {
  if (count <= 0) {
    throw new Error("placeholder count must be positive");
  }
  return new Array(count).fill("?").join(", ");
};

// Generic HTTP request builder and service

export enum HttpMethod {
  GET = 'GET',
  HEAD = 'HEAD',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
  OPTIONS = 'OPTIONS',
  TRACE = 'TRACE',
}

export interface Response<T> {
  statusCode: number;
  body: T | null;
}

// Helper types for paged responses aligned with backend
export type OrderString = 'asc' | 'desc';

export interface PageDto<K> {
  page: number;
  pageSize: number;
  total: number;
  sort?: string | null;
  order?: OrderString | null;
  singlePage: boolean;
  items: K[];
}

export type QueryParameters = Record<string, string[]>;
export type HeadersMap = Record<string, string>;

export type ExpectedResponse = 'json' | 'text' | 'void';

export class Request<T> {
  url: string;
  ssl: boolean;
  httpMethod: HttpMethod;
  headers: HeadersMap;
  parameters: QueryParameters;
  body?: T;
  expectedResponse: ExpectedResponse;

  constructor(init?: Partial<Request<T>>) {
    this.url = init?.url ?? '';
    this.ssl = init?.ssl ?? false;
    this.httpMethod = init?.httpMethod ?? HttpMethod.GET;
    this.headers = init?.headers ? { ...init.headers } : {};
    this.parameters = init?.parameters ? { ...init.parameters } : {};
    this.body = init?.body;
    this.expectedResponse = init?.expectedResponse ?? 'json';
  }

  setPaging(currentPage: number, pageSize: number): this {
    this.parameters['page'] = [String(currentPage)];
    this.parameters['page_size'] = [String(pageSize)];
    return this;
  }
}

export class RequestBuilder<T> {
  private req: Request<T>;

  constructor() {
    this.req = new Request<T>({});
  }

  url(url: string): this {
    this.req.url = url;
    return this;
  }

  ssl(ssl: boolean): this {
    this.req.ssl = ssl;
    return this;
  }

  method(method: HttpMethod): this {
    this.req.httpMethod = method;
    return this;
  }

  header(key: string, value: string): this {
    this.req.headers[key] = value;
    return this;
  }

  param(key: string, value: string): this {
    if (!this.req.parameters[key]) {
      this.req.parameters[key] = [];
    }
    this.req.parameters[key].push(value);
    return this;
  }

  contentTypeHeader(value: string): this {
    this.req.headers['Content-Type'] = value;
    return this;
  }

  authorizationHeader(value: string): this {
    this.req.headers['Authorization'] = value;
    return this;
  }

  acceptHeader(value: string): this {
    this.req.headers['Accept'] = value;
    return this;
  }

  acceptEncodingHeader(): this {
    this.req.headers['Accept-Encoding'] = 'gzip, deflate';
    return this;
  }

  body(body: T): this {
    this.req.body = body;
    return this;
  }

  responseAsText(): this {
    this.req.expectedResponse = 'text';
    return this;
  }

  responseAsVoid(): this {
    this.req.expectedResponse = 'void';
    return this;
  }

  build(): Request<T> {
    return new Request<T>({ ...this.req });
  }
}

export class RequestService {
  private static readonly REQUEST_ERROR = 'There was a problem while sending request';

  // Build final URL including host from env (VITE_API_HOST) when URL is not absolute
  private buildUrl(request: Request<unknown>): string {
    // If absolute URL provided, use it as-is
    if (/^https?:\/\//i.test(request.url)) {
      const url = new URL(request.url);
      Object.entries(request.parameters).forEach(([key, values]) => {
        values.forEach((v) => url.searchParams.append(key, v));
      });
      return url.toString();
    }

    const apiHost = import.meta.env?.VITE_API_HOST || 'localhost';
    const protocol = request.ssl ? 'https://' : 'http://';

    const path = request.url.startsWith('/') ? request.url : `/${request.url}`;
    const url = new URL(`${protocol}${apiHost}/api${path}`);

    Object.entries(request.parameters).forEach(([key, values]) => {
      values.forEach((v) => url.searchParams.append(key, v));
    });

    return url.toString();
  }

  private buildFetchInit<T>(request: Request<T>): RequestInit {
    const headers = new Headers();
    Object.entries(request.headers).forEach(([k, v]) => headers.set(k, v));

    const init: RequestInit = {
      method: request.httpMethod,
      headers,
      credentials: 'include', // rely on HTTP-only cookies
    };

    // Only attach body for methods that support it
    const method = request.httpMethod;
    const canHaveBody = method === HttpMethod.POST || method === HttpMethod.PUT || method === HttpMethod.PATCH || method === HttpMethod.OPTIONS || method === HttpMethod.TRACE;
    if (canHaveBody && request.body !== undefined) {
      if (typeof request.body === 'string') {
        init.body = request.body as unknown as BodyInit;
      } else {
        // default to JSON if content-type wasn't provided
        if (!headers.has('Content-Type')) {
          headers.set('Content-Type', 'application/json');
        }
        init.body = JSON.stringify(request.body);
      }
    }

    return init;
  }

  async send<T, K = unknown>(request: Request<T>): Promise<Response<K>> {
    try {
      const url = this.buildUrl(request);
      const init = this.buildFetchInit(request);
      const res = await fetch(url, init);

      let body: unknown = null;

      if (request.expectedResponse === 'void') {
        body = null;
      } else if (request.expectedResponse === 'text') {
        // Return raw text even if not JSON
        body = await res.text();
      } else {
        // Try parse JSON, fall back to text if not JSON
        const text = await res.text();
        if (!text) {
          body = null;
        } else {
          try {
            body = JSON.parse(text);
          } catch {
            // Not valid JSON, return raw text
            body = text;
          }
        }
      }

      return { statusCode: res.status, body } as Response<K>;
    } catch (e) {
      throw new Error(RequestService.REQUEST_ERROR);
    }
  }

  async sendVoid<T>(request: Request<T>): Promise<Response<void>> {
    request.expectedResponse = 'void';
    return this.send<T, void>(request);
  }

  async sendPaged<T, K = unknown>(request: Request<T>, pageSize: number): Promise<K[]> {
    let currentPage = 1;
    let totalItems = Number.MAX_SAFE_INTEGER;
    const allItems: K[] = [];

    while (allItems.length < totalItems) {
      request.setPaging(currentPage, pageSize);
      const response = await this.send<T, PageDto<K>>(request);
      const pageDto = response.body;

      const items = pageDto?.items ?? [];
      if (!items.length) break;

      allItems.push(...items);
      totalItems = Math.max(0, pageDto?.total ?? allItems.length);
      currentPage += 1;
    }

    return allItems;
  }
}

// Convenient factory function similar to Lombok's @Builder
export const RequestFactory = {
  builder<T>() {
    return new RequestBuilder<T>();
  },
};

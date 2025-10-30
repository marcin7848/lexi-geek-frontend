import type { Response } from '@/services/requestService';

export interface FieldValidationMessage {
  field: string;
  code: string;
  args: unknown[];
}

export interface ErrorDto {
  error: string;
  args: unknown[];
  validationMessages: FieldValidationMessage[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isFieldValidationMessage(value: unknown): value is FieldValidationMessage {
  if (!isRecord(value)) return false;
  return (
    typeof value.field === 'string' &&
    typeof value.code === 'string' &&
    Array.isArray(value.args)
  );
}

export function isErrorDto(value: unknown): value is ErrorDto {
  if (!isRecord(value)) return false;
  const { error, args, validationMessages } = value as Record<string, unknown>;
  if (typeof error !== 'string') return false;
  if (!Array.isArray(args)) return false;
  if (!Array.isArray(validationMessages)) return false;
  return (validationMessages as unknown[]).every(isFieldValidationMessage);
}

export function toFieldErrorMap(validationMessages: FieldValidationMessage[] | undefined): Record<string, string> {
  const map: Record<string, string> = {};
  if (!validationMessages) return map;
  for (const vm of validationMessages) {
    if (!vm || typeof vm.field !== 'string') continue;
    const argsStr = vm.args && vm.args.length ? `(${vm.args.join(', ')})` : '';
    map[vm.field] = `${vm.code}${argsStr}`;
  }
  return map;
}

function buildMessageFromErrorDto(dto: ErrorDto, fallbackMessage?: string): string {
  // Prefer showing validation messages when present
  if (dto.validationMessages && dto.validationMessages.length) {
    const parts = dto.validationMessages.map(vm => {
      const argsStr = vm.args && vm.args.length ? `(${vm.args.join(', ')})` : '';
      return `${vm.field}: ${vm.code}${argsStr}`;
    });
    return `Validation error: ${parts.join('; ')}`;
  }
  if (dto.error) return dto.error;
  return fallbackMessage || 'Request failed';
}

export class RequestError extends Error {
  statusCode: number;
  errorCode?: string;
  args?: unknown[];
  validationMessages?: FieldValidationMessage[];
  fieldErrors?: Record<string, string>;

  constructor(init: {
    message: string;
    statusCode: number;
    errorCode?: string;
    args?: unknown[];
    validationMessages?: FieldValidationMessage[];
  }) {
    super(init.message);
    this.name = 'RequestError';
    this.statusCode = init.statusCode;
    this.errorCode = init.errorCode;
    this.args = init.args;
    this.validationMessages = init.validationMessages;
    this.fieldErrors = toFieldErrorMap(init.validationMessages);
  }
}

export function extractMessageFromUnknown(body: unknown): string | null {
  if (typeof body === 'string') return body || null;
  if (isRecord(body) && 'message' in body && typeof (body as { message?: unknown }).message === 'string') {
    return (body as { message?: string }).message || null;
  }
  return null;
}

export function throwIfError<T>(res: Response<T>, fallbackMessage = 'Request failed'): asserts res is Response<T> {
  const status = res.statusCode;
  if (status >= 200 && status < 300) return;

  const bodyUnknown = res.body as unknown;

  if (isErrorDto(bodyUnknown)) {
    const message = buildMessageFromErrorDto(bodyUnknown, fallbackMessage);
    throw new RequestError({
      message,
      statusCode: status,
      errorCode: bodyUnknown.error,
      args: bodyUnknown.args,
      validationMessages: bodyUnknown.validationMessages,
    });
  }

  const msg = extractMessageFromUnknown(bodyUnknown) ?? fallbackMessage;
  throw new RequestError({ message: msg, statusCode: status });
}

// Utility to replace %s placeholders with provided args
export function formatWithArgs(template: string, args: unknown[] = []): string {
  if (!template.includes('%s')) return template;
  let i = 0;
  return template.replace(/%s/g, () => String(args[i++] ?? ''));
}

// Build a localized description for RequestError based on translations
// t: translation function
// fieldLabelResolver: optional function to localize field names
export function buildLocalizedErrorDescription(
  err: RequestError,
  t: (key: string) => string,
  fieldLabelResolver?: (field: string) => string
): string {
  const parts: string[] = [];
  if (err.errorCode) {
    const topKey = `error.${err.errorCode}`;
    const top = t(topKey);
    if (top && top !== topKey) parts.push(top);
  }

  if (err.validationMessages && err.validationMessages.length) {
    for (const vm of err.validationMessages) {
      const codeKey = `code.${vm.code}`;
      const template = t(codeKey);
      if (template && template !== codeKey) {
        const fieldLabel = fieldLabelResolver ? fieldLabelResolver(vm.field) : vm.field;
        const msg = formatWithArgs(template, [fieldLabel, ...(vm.args ?? [])]);
        parts.push(msg);
      } else {
        const argsStr = vm.args && vm.args.length ? ` (${vm.args.join(', ')})` : '';
        parts.push(`${vm.field}: ${vm.code}${argsStr}`);
      }
    }
  } else if (err.message) {
    if (parts.length === 0) {
      parts.push(err.message);
    }
  }

  return parts.join('\n');
}

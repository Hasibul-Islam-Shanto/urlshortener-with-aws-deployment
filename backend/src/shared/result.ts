export type Ok<T> = { readonly success: true; readonly value: T };
export type Err<E> = { readonly success: false; readonly error: E };
export type Result<T, E> = Ok<T> | Err<E>;

export const ok = <T>(value: T): Ok<T> => ({ success: true, value });

export const err = <E>(error: E): Err<E> => ({ success: false, error });

import { type AppError } from '@lib/utils';

export type IQuery<T> = {
    loading: boolean;
    error: AppError | undefined;
    current: T | undefined;
    refresh(): Promise<void>;
};

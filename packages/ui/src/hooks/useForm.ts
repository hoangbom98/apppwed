/**
 * useForm — React Hook Form + Yup resolver wrapper
 *
 * Dùng thay cho useForm trực tiếp từ react-hook-form khi cần validate bằng Yup schema.
 *
 * @example
 * const schema = yup.object({ email: yup.string().email().required() });
 * const { register, handleSubmit, formState } = useForm(schema);
 */
import { useForm as useRHFForm } from 'react-hook-form';
import type { Resolver, DefaultValues } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import type * as yup from 'yup';

export interface UseFormOptions<T extends yup.AnyObject> {
  /** Giá trị mặc định — type-safe theo schema T */
  defaultValues?: DefaultValues<T>;
  /** Chế độ trigger validate: onBlur (mặc định) | onChange | onSubmit | onTouched | all */
  mode?: 'onBlur' | 'onChange' | 'onSubmit' | 'onTouched' | 'all';
}

/**
 * Wrapper nhẹ quanh react-hook-form với Yup resolver tích hợp sẵn.
 * Trả về toàn bộ API của useForm — không mất bất kỳ tính năng nào.
 */
export function useForm<T extends yup.AnyObject>(
  schema: yup.ObjectSchema<T>,
  options: UseFormOptions<T> = {},
) {
  const { defaultValues, mode = 'onBlur' } = options;

  return useRHFForm<T>({
    resolver: yupResolver(schema) as unknown as Resolver<T>,
    defaultValues,
    mode,
  });
}

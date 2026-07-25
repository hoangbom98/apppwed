// @ts-nocheck
import React from 'react';
import { useForm } from 'react-hook-form';

export const DynamicForm = ({ schema, onSubmit }) => {
  const { register, handleSubmit, formState: { errors } } = useForm();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {schema.map((field) => (
        <div key={field.name} className="flex flex-col">
          <label className="text-sm font-medium">{field.label}</label>
          <input
            {...register(field.name, { required: field.required })}
            type={field.type || 'text'}
            className="border rounded p-2"
          />
          {errors[field.name] && <span className="text-red-500 text-xs">Trường này là bắt buộc</span>}
        </div>
      ))}
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
        Lưu
      </button>
    </form>
  );
};

import React from 'react';
import { Form, FormProps } from 'antd';

export const ProForm = (props: FormProps) => (
  <Form {...props} layout="vertical" scrollToFirstError />
);

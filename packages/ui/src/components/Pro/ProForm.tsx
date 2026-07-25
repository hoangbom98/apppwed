// @ts-nocheck
import React from 'react';
import { Form } from 'antd';
import type { FormProps } from 'antd';

export const ProForm = (props: FormProps) => (
  <Form layout="vertical" scrollToFirstError {...props} />
);

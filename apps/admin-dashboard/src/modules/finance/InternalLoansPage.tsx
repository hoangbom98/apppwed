// @ts-nocheck
/**
 * InternalLoansPage.tsx — Quản lý vay nội bộ
 */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Typography, Flex, Alert, Row, Col } from 'antd';
import { LkvipStatusTag, LkvipStatCard, LkvipTable } from '@lkvip/ui';
import { groupFinanceApi } from './api';

const { Title, Text } = Typography;

function vndFull(n: number) {
  return Number(n).toLocaleString('vi-VN') + 'đ';
}

export default function InternalLoansPage() {
  const { data: loans = [], isLoading } = useQuery({
    queryKey: ['internal-loans'],
    queryFn:  () => groupFinanceApi.loans(),
    staleTime: 30_000,
  });

  const loansArr = loans as any[];
  const activeLoans = loansArr.filter((l: any) => l.status === 'ACTIVE');
  const totalDebt   = activeLoans.reduce((s: number, l: any) => s + Number(l.amount), 0);
  const totalInterest = loansArr.reduce((s: number, l: any) => s + Number(l.totalInterest), 0);

  const columns = [
    {
      title: 'Dự án', dataIndex: 'source', key: 'source', width: 90,
      render: (v: string) => <LkvipStatusTag status={v} type="source" />,
    },
    {
      title: 'Vốn vay', dataIndex: 'amount', key: 'amount', width: 130,
      render: (v: number) => <Text strong>{vndFull(v)}</Text>,
    },
    {
      title: 'Lãi suất/ngày', dataIndex: 'interestRate', key: 'rate', width: 110,
      render: (v: number) => <Text>{(Number(v) * 100).toFixed(4)}%</Text>,
    },
    {
      title: 'Lãi tích lũy', dataIndex: 'totalInterest', key: 'interest', width: 130,
      render: (v: number) => <Text>{vndFull(v)}</Text>,
    },
    {
      title: 'Ngày vay', dataIndex: 'startDate', key: 'start', width: 110,
      render: (v: string) => <Text>{new Date(v).toLocaleDateString('vi-VN')}</Text>,
    },
    {
      title: 'Trạng thái', dataIndex: 'status', key: 'status', width: 90,
      render: (v: string) => <LkvipStatusTag status={v} type="status" />,
    },
    {
      title: 'Ghi chú', key: 'note',
      render: (_: any, r: any) => (
        <Text type="secondary">{r.endDate ? `Đóng: ${new Date(r.endDate).toLocaleDateString('vi-VN')}` : 'Chưa đóng'}</Text>
      ),
    },
  ];

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>Vay nội bộ (Internal Loans)</Title>

      <Alert
        type="warning" showIcon style={{ marginBottom: 16 }}
        message="Khi số dư pool của một BU âm, hệ thống tự động ghi nhận khoản vay nội bộ và tính lãi hàng ngày. Admin có thể điều chỉnh lãi suất tại SystemConfig."
      />

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}>
          <LkvipStatCard title="Tổng khoản vay" value={activeLoans.length} suffix="khoản" color="#ff4d4f" />
        </Col>
        <Col xs={12} md={6}>
          <LkvipStatCard title="Tổng dư nợ" value={vndFull(totalDebt)} color="#ff4d4f" />
        </Col>
        <Col xs={12} md={6}>
          <LkvipStatCard title="Tổng lãi tích lũy" value={vndFull(totalInterest)} color="#f59e0b" />
        </Col>
        <Col xs={12} md={6}>
          <LkvipStatCard title="Khoản đã hoàn" value={loansArr.filter((l: any) => l.status === 'PAID').length} suffix="khoản" color="#52c41a" />
        </Col>
      </Row>

      <LkvipTable
        dataSource={loansArr}
        columns={columns}
        rowKey="id"
        loading={isLoading}
      />
    </div>
  );
}

// @ts-nocheck
/**
 * InternalLoansPage.tsx — Quản lý vay nội bộ
 *
 * Khi ProjectBalance < 0, InterestWorker tự tạo InternalLoan
 * và tính lãi hàng ngày theo rate cấu hình.
 */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Table, Tag, Typography, Flex, Alert, Card, Statistic, Row, Col,
} from 'antd';
import { groupFinanceApi } from './api';

const { Title, Text } = Typography;

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: 'error',
  PAID:   'success',
};
const SOURCE_COLOR: Record<string, string> = {
  GAME: '#3b82f6', SPORTS: '#10b981', TRADE: '#f59e0b', DATING: '#ec4899', HUB: '#8b5cf6',
};

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
      render: (v: string) => (
        <Tag color={SOURCE_COLOR[v]} style={{ fontWeight: 700, fontSize: 11 }}>{v}</Tag>
      ),
    },
    {
      title: 'Vốn vay', dataIndex: 'amount', key: 'amount', width: 130,
      render: (v: number) => (
        <Text strong style={{ fontFamily: 'monospace', color: '#ff4d4f' }}>{vndFull(v)}</Text>
      ),
    },
    {
      title: 'Lãi suất/ngày', dataIndex: 'interestRate', key: 'rate', width: 110,
      render: (v: number) => (
        <Text style={{ fontFamily: 'monospace', fontSize: 12 }}>{(Number(v) * 100).toFixed(4)}%</Text>
      ),
    },
    {
      title: 'Lãi tích lũy', dataIndex: 'totalInterest', key: 'interest', width: 130,
      render: (v: number) => (
        <Text style={{ fontFamily: 'monospace', color: '#f59e0b' }}>{vndFull(v)}</Text>
      ),
    },
    {
      title: 'Ngày vay', dataIndex: 'startDate', key: 'start', width: 110,
      render: (v: string) => (
        <Text style={{ fontSize: 11, color: '#8c8c8c' }}>{new Date(v).toLocaleDateString('vi-VN')}</Text>
      ),
    },
    {
      title: 'Trạng thái', dataIndex: 'status', key: 'status', width: 90,
      render: (v: string) => (
        <Tag color={STATUS_COLOR[v] ?? 'default'} style={{ fontSize: 11 }}>
          {v === 'ACTIVE' ? 'Đang vay' : 'Đã hoàn'}
        </Tag>
      ),
    },
    {
      title: 'Ghi chú', key: 'note',
      render: (_: any, r: any) => (
        <Text style={{ fontSize: 11, color: '#8c8c8c' }}>
          {r.endDate ? `Đóng: ${new Date(r.endDate).toLocaleDateString('vi-VN')}` : 'Chưa đóng'}
        </Text>
      ),
    },
  ];

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>Vay nội bộ (Internal Loans)</Title>

      <Alert
        type="warning" showIcon style={{ marginBottom: 16, fontSize: 12 }}
        message="Khi số dư pool của một BU âm, hệ thống tự động ghi nhận khoản vay nội bộ và tính lãi hàng ngày (mặc định 0.05%/ngày). Admin có thể điều chỉnh lãi suất tại SystemConfig key 'internal_loan_rate'."
      />

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic
              title="Tổng khoản vay đang mở"
              value={activeLoans.length}
              suffix="khoản"
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic
              title="Tổng dư nợ"
              value={vndFull(totalDebt)}
              valueStyle={{ color: '#ff4d4f', fontSize: 16, fontFamily: 'monospace' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic
              title="Tổng lãi tích lũy"
              value={vndFull(totalInterest)}
              valueStyle={{ color: '#f59e0b', fontSize: 16, fontFamily: 'monospace' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic
              title="Khoản đã hoàn"
              value={loansArr.filter((l: any) => l.status === 'PAID').length}
              suffix="khoản"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Table
        dataSource={loansArr}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        size="small"
        scroll={{ x: 700 }}
        pagination={{ pageSize: 20, showTotal: (t) => `${t} khoản` }}
      />
    </div>
  );
}

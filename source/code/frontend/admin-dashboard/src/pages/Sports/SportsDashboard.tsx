// frontend/admin-dashboard/src/pages/Sports/SportsDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Table, Button, DatePicker, message, Tag } from 'antd';
import { SyncOutlined } from '@ant-design/icons';
import api from '../../api/client';

const SportsDashboard: React.FC = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncDate, setSyncDate] = useState<any>(null);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/sports');
      setEvents(res.data);
    } catch (error) {
      message.error('Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  const syncEvents = async () => {
    if (!syncDate) return message.warn('Please select a date');
    try {
      await api.post('/api/sports/sync', { date: syncDate.format('YYYY-MM-DD') });
      message.success('Sync started');
      fetchEvents();
    } catch {
      message.error('Sync failed');
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Home', dataIndex: 'homeTeam', key: 'homeTeam' },
    { title: 'Away', dataIndex: 'awayTeam', key: 'awayTeam' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <Tag>{s}</Tag> },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <DatePicker onChange={(date) => setSyncDate(date)} />
        <Button icon={<SyncOutlined />} onClick={syncEvents} style={{ marginLeft: 8 }}>Sync Events</Button>
      </div>
      <Table dataSource={events} columns={columns} rowKey="id" loading={loading} />
    </div>
  );
};

export default SportsDashboard;

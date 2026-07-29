import { useState } from 'react';
import { Key, Plus, Copy } from 'lucide-react';
import { useAPIKeys, useCreateAPIKey } from '../../hooks/useStore';
import toast from 'react-hot-toast';

export default function APIKeysPage() {
  const { data, isLoading } = useAPIKeys();
  const createKey           = useCreateAPIKey();
  const [name, setName]     = useState('');
  const keys = data?.data ?? data ?? [];

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      await createKey.mutateAsync({ name: name.trim(), productId: '' });
      setName('');
      toast.success('Đã tạo API key mới');
    } catch { toast.error('Tạo API key thất bại'); }
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key).then(() => toast.success('Đã copy!'));
  };

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--store-text)', marginBottom: 24 }}>API Keys</h1>

      {/* Create form */}
      <div style={{ background: 'var(--store-surface)', border: '1px solid var(--store-border)', borderRadius: 12, padding: '20px', marginBottom: 20, display: 'flex', gap: 10 }}>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Tên API key (vd: Production, Testing)"
          style={{ flex: 1, padding: '10px 14px', border: '1px solid var(--store-border)', borderRadius: 8, fontSize: 14, color: 'var(--store-text)', background: 'transparent', outline: 'none' }}
        />
        <button
          onClick={handleCreate}
          disabled={createKey.isPending || !name.trim()}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: 'var(--store-primary)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
        >
          <Plus size={15} /> Tạo key
        </button>
      </div>

      {/* Keys list */}
      {isLoading ? (
        <div style={{ color: 'var(--store-muted)', padding: '40px 0', textAlign: 'center' }}>Đang tải...</div>
      ) : keys.length === 0 ? (
        <div style={{ background: 'var(--store-surface)', border: '1px dashed var(--store-border)', borderRadius: 12, padding: '40px', textAlign: 'center' }}>
          <Key size={32} color="var(--store-border)" style={{ marginBottom: 10 }} />
          <p style={{ color: 'var(--store-muted)' }}>Chưa có API key nào.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {keys.map((k: { id: string; name: string; key: string; createdAt: string; lastUsed?: string }) => (
            <div key={k.id} style={{ background: 'var(--store-surface)', border: '1px solid var(--store-border)', borderRadius: 10, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <Key size={16} color="var(--store-primary)" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 200 }}>
                <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--store-text)', marginBottom: 4 }}>{k.name}</p>
                <code style={{ fontSize: 12, color: 'var(--store-muted)' }}>{k.key?.slice(0, 32)}••••</code>
              </div>
              <button
                onClick={() => copyKey(k.key)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'transparent', border: '1px solid var(--store-border)', borderRadius: 7, fontSize: 13, cursor: 'pointer', color: 'var(--store-muted)' }}
              >
                <Copy size={13} /> Copy
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

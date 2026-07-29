import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Star, X, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useWatchlists,
  useCreateWatchlist,
  useDeleteWatchlist,
  useAddToWatchlist,
  useRemoveFromWatchlist,
  usePairs,
} from '../hooks/useCrypto';

export default function Watchlist() {
  const nav = useNavigate();
  const { data: lists = [], isLoading } = useWatchlists();
  const { data: allPairs = [] }         = usePairs();

  const createList  = useCreateWatchlist();
  const deleteList  = useDeleteWatchlist();
  const addItem     = useAddToWatchlist();
  const removeItem  = useRemoveFromWatchlist();

  const [activeListId, setActiveListId]   = useState<string | null>(null);
  const [newListName, setNewListName]     = useState('');
  const [showCreate, setShowCreate]       = useState(false);
  const [showAddModal, setShowAddModal]   = useState(false);
  const [addSearch, setAddSearch]         = useState('');

  const activeList = lists.find(l => l.id === activeListId) ?? lists[0] ?? null;

  const handleCreateList = async () => {
    if (!newListName.trim()) return;
    try {
      await createList.mutateAsync(newListName.trim());
      toast.success('Đã tạo danh sách');
      setNewListName('');
      setShowCreate(false);
    } catch { toast.error('Không thể tạo danh sách'); }
  };

  const handleDeleteList = async (id: string) => {
    if (!confirm('Xoá danh sách này?')) return;
    try {
      await deleteList.mutateAsync(id);
      toast.success('Đã xoá');
      if (activeListId === id) setActiveListId(null);
    } catch { toast.error('Không thể xoá'); }
  };

  const handleAddSymbol = async (symbolCode: string) => {
    if (!activeList) return;
    try {
      await addItem.mutateAsync({ watchlistId: activeList.id, symbolCode });
      toast.success(`Đã thêm ${symbolCode}`);
      setShowAddModal(false);
    } catch { toast.error('Không thể thêm symbol'); }
  };

  const handleRemoveSymbol = async (symbolId: string) => {
    if (!activeList) return;
    try {
      await removeItem.mutateAsync({ watchlistId: activeList.id, symbolId });
      toast.success('Đã xoá');
    } catch { toast.error('Không thể xoá'); }
  };

  const filteredPairs = allPairs.filter(p => {
    const s = addSearch.toLowerCase();
    const inList = activeList?.items.some(i => i.symbol.code === p.code);
    return !inList && (p.code.toLowerCase().includes(s) || p.baseAsset.toLowerCase().includes(s));
  });

  if (isLoading) {
    return (
      <div className="py-20 text-center text-sm" style={{ color: 'var(--cr-muted)' }}>Đang tải...</div>
    );
  }

  return (
    <div className="px-4 pt-4">
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-base" style={{ color: 'var(--cr-text)' }}>Danh sách theo dõi</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold"
          style={{ background: 'var(--cr-primary)', color: '#fff' }}
        >
          <Plus size={14} /> Tạo mới
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="mb-4 p-3 rounded-xl" style={{ background: 'var(--cr-surface)', border: '1px solid var(--cr-border)' }}>
          <input
            value={newListName} onChange={e => setNewListName(e.target.value)}
            placeholder="Tên danh sách (VD: Top 10)"
            className="w-full py-2.5 px-3 rounded-lg text-sm outline-none mb-2"
            style={{ background: 'var(--cr-surface-2)', border: '1px solid var(--cr-border)', color: 'var(--cr-text)' }}
            autoFocus
            onKeyDown={e => e.key === 'Enter' && handleCreateList()}
          />
          <div className="flex gap-2">
            <button onClick={handleCreateList} disabled={createList.isPending}
              className="flex-1 py-2 rounded-lg text-xs font-bold text-white"
              style={{ background: 'var(--cr-primary)' }}>Tạo</button>
            <button onClick={() => setShowCreate(false)}
              className="px-4 py-2 rounded-lg text-xs" style={{ background: 'var(--cr-surface-2)', color: 'var(--cr-muted)' }}>Huỷ</button>
          </div>
        </div>
      )}

      {/* List tabs */}
      {lists.length === 0 ? (
        <div className="py-20 text-center">
          <Star size={40} color="var(--cr-border)" className="mx-auto mb-3" />
          <p className="text-sm font-medium" style={{ color: 'var(--cr-muted)' }}>Chưa có danh sách nào</p>
          <p className="text-xs mt-1" style={{ color: 'var(--cr-muted)' }}>Tạo danh sách để theo dõi các cặp yêu thích</p>
        </div>
      ) : (
        <>
          {/* List selector */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {lists.map(l => (
              <button
                key={l.id}
                onClick={() => setActiveListId(l.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex-shrink-0"
                style={{
                  background: (activeList?.id === l.id) ? 'var(--cr-primary)' : 'var(--cr-surface)',
                  color:      (activeList?.id === l.id) ? '#fff' : 'var(--cr-muted)',
                  border: '1px solid var(--cr-border)',
                }}
              >
                <Star size={11} />
                {l.name}
                <span className="opacity-60">({l.items.length})</span>
              </button>
            ))}
          </div>

          {/* Active list content */}
          {activeList && (
            <div className="rounded-xl overflow-hidden" style={{ background: 'var(--cr-surface)', border: '1px solid var(--cr-border)' }}>
              {/* List header */}
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--cr-border)' }}>
                <span className="text-sm font-bold" style={{ color: 'var(--cr-text)' }}>{activeList.name}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs"
                    style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--cr-primary)' }}
                  >
                    <Plus size={12} /> Thêm
                  </button>
                  <button
                    onClick={() => handleDeleteList(activeList.id)}
                    className="p-1 rounded-lg"
                    style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--cr-red)' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Items */}
              {activeList.items.length === 0 ? (
                <div className="py-12 text-center text-sm" style={{ color: 'var(--cr-muted)' }}>
                  Chưa có symbol nào. Nhấn &quot;Thêm&quot; để bắt đầu.
                </div>
              ) : (
                activeList.items.map(item => {
                  const pair = allPairs.find(p => p.code === item.symbol.code);
                  const change = pair?.priceChange ?? 0;
                  const price  = pair?.lastPrice ?? 0;
                  return (
                    <div key={item.id} className="flex items-center px-4 py-3" style={{ borderBottom: '1px solid var(--cr-border)' }}>
                      <button className="flex-1 flex items-center gap-3" onClick={() => nav(`/chart/${item.symbol.code}`)}>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black"
                          style={{ background: 'var(--cr-surface-2)', color: 'var(--cr-primary)', border: '1px solid var(--cr-border)' }}>
                          {item.symbol.baseAsset.slice(0, 2)}
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold" style={{ color: 'var(--cr-text)' }}>
                            {item.symbol.baseAsset}/{item.symbol.quoteAsset}
                          </p>
                          {pair && (
                            <p className="text-xs font-semibold" style={{ color: change >= 0 ? 'var(--cr-green)' : 'var(--cr-red)' }}>
                              ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: price < 1 ? 6 : 2 })} &nbsp;
                              {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                            </p>
                          )}
                        </div>
                      </button>
                      <div className="flex items-center gap-2">
                        <button onClick={() => nav(`/chart/${item.symbol.code}`)}
                          className="p-1.5 rounded-lg" style={{ color: 'var(--cr-muted)' }}>
                          <ChevronRight size={16} />
                        </button>
                        <button onClick={() => handleRemoveSymbol(item.symbolId)}
                          className="p-1.5 rounded-lg" style={{ color: 'var(--cr-red)' }}>
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </>
      )}

      {/* Add symbol modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setShowAddModal(false)}>
          <div className="w-full rounded-t-2xl pb-8 max-h-[80vh] flex flex-col"
            style={{ background: 'var(--cr-surface)' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--cr-border)' }}>
              <span className="font-bold" style={{ color: 'var(--cr-text)' }}>Thêm symbol</span>
              <button onClick={() => setShowAddModal(false)}><X size={18} color="var(--cr-muted)" /></button>
            </div>
            <div className="px-4 py-3">
              <input value={addSearch} onChange={e => setAddSearch(e.target.value)}
                placeholder="Tìm BTC, ETH..."
                className="w-full py-2.5 px-3 rounded-xl text-sm outline-none"
                style={{ background: 'var(--cr-surface-2)', border: '1px solid var(--cr-border)', color: 'var(--cr-text)' }}
                autoFocus
              />
            </div>
            <div className="flex-1 overflow-y-auto px-4">
              {filteredPairs.slice(0, 30).map(p => (
                <button key={p.id} onClick={() => handleAddSymbol(p.code)}
                  className="w-full flex items-center gap-3 py-3 text-left" style={{ borderBottom: '1px solid var(--cr-border)' }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black"
                    style={{ background: 'var(--cr-surface-2)', color: 'var(--cr-primary)' }}>
                    {p.baseAsset.slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--cr-text)' }}>{p.baseAsset}/{p.quoteAsset}</p>
                    <p className="text-xs" style={{ color: 'var(--cr-muted)' }}>{p.name}</p>
                  </div>
                  <div className="ml-auto">
                    <Plus size={16} color="var(--cr-primary)" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

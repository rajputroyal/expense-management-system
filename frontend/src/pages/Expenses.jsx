import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { EXPENSE_CATEGORIES } from '../constants/categories';

const empty = { title: '', amount: '', category: '', date: new Date().toISOString().slice(0, 10), paymentMethod: 'UPI', description: '' };
const initialQuery = { page: 1, limit: 10, search: '', status: '', category: '', from: '', to: '', sort: 'date', order: 'DESC' };

export default function Expenses() {
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({});
  const [query, setQuery] = useState(initialQuery);
  const [searchInput, setSearchInput] = useState('');
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [historyFor, setHistoryFor] = useState(null);
  const { user } = useAuth();

  function filterParams(includePaging = true) {
    const params = {};
    if (includePaging) { params.page = query.page; params.limit = query.limit; }
    if (query.search) params.search = query.search;
    if (query.status) params.status = query.status;
    if (query.category) params.category = query.category;
    if (query.from) params.from = query.from;
    if (query.to) params.to = query.to;
    params.sort = query.sort;
    params.order = query.order;
    return params;
  }

  async function load() {
    try {
      const r = await api.get('/expenses', { params: filterParams() });
      setRows(r.data.data);
      setPagination(r.data.pagination);
      setError('');
    } catch (e) {
      setError(e.response?.data?.message || 'Unable to load expenses');
    }
  }

  useEffect(() => { load(); }, [query]);
  useEffect(() => {
    const timer = setTimeout(() => setQuery(q => (q.search === searchInput ? q : { ...q, search: searchInput, page: 1 })), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  function updateFilter(key, value) {
    setQuery(q => ({ ...q, [key]: value, page: 1 }));
  }

  async function save(e) {
    e.preventDefault();
    setError('');
    try {
      if (editing) await api.patch(`/expenses/${editing}`, form);
      else await api.post('/expenses', form);
      setForm(empty);
      setEditing(null);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'Unable to save expense');
    }
  }

  async function remove(id) {
    if (!confirm('Delete this expense?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'Unable to delete expense');
    }
  }

  async function decide(id, action) {
    const reason = action === 'reject' ? prompt('Enter rejection reason:') : null;
    if (action === 'reject' && !reason) return;
    try {
      await api.post(`/expenses/${id}/${action}`, action === 'reject' ? { reason } : {});
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'Action failed');
    }
  }

  function edit(row) {
    setEditing(row.id);
    setForm({ ...empty, title: row.title, amount: row.amount, category: row.category, date: row.date, paymentMethod: row.paymentMethod, description: row.description || '', version: row.version });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function openHistory(row) {
    try {
      const r = await api.get(`/expenses/${row.id}/audits`);
      setHistory(r.data.data);
      setHistoryFor(row);
    } catch (e) {
      setError(e.response?.data?.message || 'Unable to load audit history');
    }
  }

  async function exportReport(format) {
    try {
      const r = await api.get('/reports/expenses/export', { params: { ...filterParams(false), format }, responseType: 'blob' });
      const u = URL.createObjectURL(r.data);
      const a = document.createElement('a');
      a.href = u;
      a.download = format === 'xls' ? 'expenses.xls' : 'expenses.csv';
      a.click();
      URL.revokeObjectURL(u);
    } catch (err) {
      setError(err.response?.data?.message || 'Export failed');
    }
  }

  const money = n => `Rs. ${Number(n || 0).toLocaleString('en-IN')}`;

  return (
    <>
      <h1>Expenses</h1>
      <form className="panel expense-form" onSubmit={save}>
        <h2>{editing ? 'Edit expense' : 'Add expense'}</h2>
        {error && <div className="error">{error}</div>}
        <div className="form-grid">
          <label>Title<input required minLength="2" aria-label="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></label>
          <label>Amount<input required type="number" min="0.01" step="0.01" aria-label="Amount" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></label>
          <label>Category
            <select required aria-label="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              <option value="" disabled>Select Category</option>
              {EXPENSE_CATEGORIES.map(category => <option key={category} value={category}>{category}</option>)}
            </select>
          </label>
          <label>Date<input required type="date" aria-label="Date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></label>
          <label>Payment method<select aria-label="Payment method" value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })}>{['CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'OTHER'].map(x => <option key={x}>{x}</option>)}</select></label>
          <label>Description<input required aria-label="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></label>
        </div>
        <div className="actions">
          <button type="submit">{editing ? 'Update expense' : 'Add expense'}</button>
          {editing && <button type="button" className="secondary" onClick={() => { setEditing(null); setForm(empty); }}>Cancel</button>}
        </div>
      </form>
      <section className="panel">
        <div className="toolbar">
          <input placeholder="Search title or description" aria-label="Search" value={searchInput} onChange={e => setSearchInput(e.target.value)} />
          <select aria-label="Status" value={query.status} onChange={e => updateFilter('status', e.target.value)}>
            <option value="">All statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
          <select aria-label="Category filter" value={query.category} onChange={e => updateFilter('category', e.target.value)}>
            <option value="">All categories</option>
            {EXPENSE_CATEGORIES.map(category => <option key={category} value={category}>{category}</option>)}
          </select>
          <input type="date" aria-label="From date" value={query.from} onChange={e => updateFilter('from', e.target.value)} />
          <input type="date" aria-label="To date" value={query.to} onChange={e => updateFilter('to', e.target.value)} />
          <select aria-label="Sort by" value={query.sort} onChange={e => updateFilter('sort', e.target.value)}>
            <option value="date">Sort: Date</option>
            <option value="amount">Sort: Amount</option>
            <option value="title">Sort: Title</option>
            <option value="createdAt">Sort: Created at</option>
          </select>
          <select aria-label="Sort order" value={query.order} onChange={e => updateFilter('order', e.target.value)}>
            <option value="DESC">Descending</option>
            <option value="ASC">Ascending</option>
          </select>
          <button type="button" className="secondary" onClick={() => { setQuery(initialQuery); setSearchInput(''); }}>Clear</button>
          <button type="button" className="secondary" onClick={() => exportReport('csv')}>Export CSV</button>
          <button type="button" className="secondary" onClick={() => exportReport('xls')}>Export Excel</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Title</th><th>Amount</th><th>Category</th><th>Date</th><th>Status</th><th>Created by</th><th>Actions</th></tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td>{r.title}</td>
                  <td>{money(r.amount)}</td>
                  <td>{r.category}</td>
                  <td>{r.date}</td>
                  <td><span className={`status ${r.status.toLowerCase()}`}>{r.status}</span></td>
                  <td>{r.creator?.name}</td>
                  <td className="row-actions">
                    <button className="small secondary" onClick={() => openHistory(r)}>History</button>
                    {r.status === 'PENDING' && (user.role === 'ADMIN' || r.createdBy === user.id) && <>
                      <button className="small secondary" onClick={() => edit(r)}>Edit</button>
                      <button className="small danger" onClick={() => remove(r.id)}>Delete</button>
                    </>}
                    {user.role === 'ADMIN' && r.status === 'PENDING' && <>
                      <button className="small" onClick={() => decide(r.id, 'approve')}>Approve</button>
                      <button className="small danger" onClick={() => decide(r.id, 'reject')}>Reject</button>
                    </>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && <p className="empty">No expenses found.</p>}
        </div>
        <div className="pagination">
          <span>{pagination.total || 0} records</span>
          <div>
            <button type="button" className="secondary" disabled={query.page <= 1} onClick={() => setQuery(q => ({ ...q, page: q.page - 1 }))}>Previous</button>
            <span> Page {query.page} of {pagination.totalPages || 1} </span>
            <button type="button" className="secondary" disabled={query.page >= (pagination.totalPages || 1)} onClick={() => setQuery(q => ({ ...q, page: q.page + 1 }))}>Next</button>
          </div>
        </div>
      </section>
      {historyFor && (
        <section className="panel">
          <h2>Audit history: {historyFor.title}</h2>
          {history.map(a => (
            <p className="line" key={a.id}>
              <span>{a.action}{a.reason ? ` - ${a.reason}` : ''}</span>
              <small>{a.actor?.name} · {new Date(a.createdAt).toLocaleString()}</small>
            </p>
          ))}
          {!history.length && <p className="empty">No audit records.</p>}
          <div className="actions"><button type="button" className="secondary" onClick={() => setHistoryFor(null)}>Close</button></div>
        </section>
      )}
    </>
  );
}

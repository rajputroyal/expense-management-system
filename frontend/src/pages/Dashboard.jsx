import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../services/api';

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/dashboard/summary')
      .then(r => setSummary(r.data.data))
      .catch(e => setError(e.response?.data?.message || 'Could not load dashboard'));
  }, []);

  if (error) return <div className="error">{error}</div>;
  if (!summary) return <p>Loading dashboard...</p>;

  const money = n => `Rs. ${Number(n || 0).toLocaleString('en-IN')}`;

  return (
    <>
      <h1>Dashboard</h1>
      <section className="stats">
        <article className="panel"><span>This month</span><strong>{money(summary.totals.monthlyTotal)}</strong></article>
        <article className="panel"><span>This year</span><strong>{money(summary.totals.yearlyTotal)}</strong></article>
        <article className="panel"><span>Highest expense</span><strong>{summary.highestExpense ? money(summary.highestExpense.amount) : '-'}</strong><small>{summary.highestExpense?.title || 'No expenses yet'}</small></article>
      </section>
      <section className="panel">
        <h2>Monthly expense trend</h2>
        <div className="chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={summary.monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" fill="#3867d6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
      <section className="two-col">
        <div className="panel">
          <h2>Category summary</h2>
          {summary.categories.length ? summary.categories.map(c => <p className="line" key={c.category}><span>{c.category}</span><b>{money(c.total)}</b></p>) : <p className="empty">No category data</p>}
        </div>
        <div className="panel">
          <h2>Approval status</h2>
          {summary.statusBreakdown.length ? summary.statusBreakdown.map(s => <p className="line" key={s.status}><span>{s.status}</span><b>{s.count}</b></p>) : <p className="empty">No status data</p>}
        </div>
      </section>
    </>
  );
}

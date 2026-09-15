import { createClient } from '@/utils/supabase/server';
import DashboardChart from '@/components/admin/DashboardChart';

export default async function AdminDashboard() {
  const supabase = await createClient();

  // These 4 queries are fully independent — run them concurrently instead of
  // awaiting each one in sequence.
  const [
    { count: pendingOrdersCount },
    { count: productsCount },
    { count: categoriesCount },
    { data: orders },
  ] = await Promise.all([
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('categories').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('created_at').order('created_at', { ascending: true }).limit(100),
  ]);

  // Group by date
  const chartDataMap: Record<string, number> = {};
  if (orders) {
    orders.forEach(order => {
      const date = new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      chartDataMap[date] = (chartDataMap[date] || 0) + 1;
    });
  }

  const chartData = Object.keys(chartDataMap).map(date => ({
    date,
    count: chartDataMap[date],
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-heading">Dashboard</h1>
      <h2 className="sr-only">Key Statistics</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500">Pending Orders</h3>
          <p className="text-3xl font-bold mt-2">{pendingOrdersCount || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500">Total Products</h3>
          <p className="text-3xl font-bold mt-2">{productsCount || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500">Total Categories</h3>
          <p className="text-3xl font-bold mt-2">{categoriesCount || 0}</p>
        </div>
      </div>
      
      <h2 className="sr-only">Analytics</h2>
      <div className="bg-white p-6 rounded-lg shadow-sm border h-96 flex flex-col">
        <h3 className="text-sm font-medium text-gray-500 mb-4">Orders Over Time</h3>
        <div className="flex-1">
          <DashboardChart data={chartData} />
        </div>
      </div>
    </div>
  );
}

import type { Meta, StoryObj } from '@storybook/react';
import DataTable, { type DataTableColumn } from './DataTable';

interface SampleRow {
  id: string;
  name: string;
  email: string;
  status: string;
  revenue: number;
  visits: number;
}

const sampleData: SampleRow[] = Array.from({ length: 25 }, (_, i) => ({
  id: `client-${i + 1}`,
  name: ['Sarah Johnson', 'Emily Chen', 'Maria Rodriguez', 'Ava Thompson', 'Lisa Kim'][i % 5],
  email: `client${i + 1}@example.com`,
  status: ['Active', 'VIP', 'Lapsed', 'New', 'Active'][i % 5],
  revenue: Math.floor(Math.random() * 5000 + 500),
  visits: Math.floor(Math.random() * 20 + 1),
}));

const columns: DataTableColumn<SampleRow>[] = [
  { key: 'name', header: 'Client', sticky: true },
  { key: 'email', header: 'Email', hideOnMobile: true },
  {
    key: 'status',
    header: 'Status',
    render: (row) => (
      <span
        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
          row.status === 'VIP' ? 'bg-amber-50 text-amber-700' :
          row.status === 'Active' ? 'bg-emerald-50 text-emerald-700' :
          row.status === 'Lapsed' ? 'bg-red-50 text-red-600' :
          'bg-blue-50 text-blue-700'
        }`}
      >
        {row.status}
      </span>
    ),
  },
  {
    key: 'revenue',
    header: 'Revenue',
    align: 'right',
    accessor: (row) => row.revenue,
    render: (row) => `$${row.revenue.toLocaleString()}`,
  },
  {
    key: 'visits',
    header: 'Visits',
    align: 'center',
    hideOnMobile: true,
    accessor: (row) => row.visits,
  },
];

const meta: Meta<typeof DataTable> = {
  title: 'Dashboard/Shared/DataTable',
  component: DataTable,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="p-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof DataTable<SampleRow>>;

export const Default: Story = {
  args: {
    columns,
    data: sampleData,
    rowKey: (row: SampleRow) => row.id,
    title: 'Client List',
    subtitle: '25 total clients',
  },
};

export const WithHeaderActions: Story = {
  args: {
    columns,
    data: sampleData,
    rowKey: (row: SampleRow) => row.id,
    title: 'Revenue Report',
    headerActions: (
      <select className="text-xs border border-gray-200 rounded-lg px-2 py-1">
        <option>Last 30 Days</option>
        <option>Last 90 Days</option>
      </select>
    ),
    onExport: () => {},
  },
};

export const Loading: Story = {
  args: {
    columns,
    data: [],
    rowKey: (row: SampleRow) => row.id,
    loading: true,
  },
};

export const ErrorStory: Story = {
  name: 'Error',
  args: {
    columns,
    data: [],
    rowKey: (row: SampleRow) => row.id,
    error: new Error('Failed to load'),
    onRetry: () => {},
  },
};

export const Empty: Story = {
  args: {
    columns,
    data: [],
    rowKey: (row: SampleRow) => row.id,
    emptyTitle: 'No clients yet',
    emptyDescription: 'Add your first client to populate this table.',
    emptyIcon: 'users',
  },
};

export const ClickableRows: Story = {
  args: {
    columns,
    data: sampleData.slice(0, 5),
    rowKey: (row: SampleRow) => row.id,
    title: 'Click any row',
    onRowClick: (row: SampleRow) => alert(`Clicked: ${row.name}`),
    paginate: false,
  },
};

export const SmallPageSize: Story = {
  args: {
    columns,
    data: sampleData,
    rowKey: (row: SampleRow) => row.id,
    title: 'Paginated (5 per page)',
    pageSize: 5,
  },
};

export const NonSearchable: Story = {
  args: {
    columns,
    data: sampleData.slice(0, 8),
    rowKey: (row: SampleRow) => row.id,
    title: 'No Search',
    searchable: false,
    paginate: false,
  },
};

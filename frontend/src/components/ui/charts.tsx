import React from 'react';

interface ChartData {
  name: string;
  value: number;
  date?: string;
  completed?: number;
  created?: number;
}

interface ChartProps {
  data?: ChartData[];
  className?: string;
}

export const LineChart: React.FC<ChartProps> = ({ data, className }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  return (
    <div className={`h-64 flex items-end justify-between space-x-1 ${className}`}>
      {data.map((item, index) => (
        <div key={index} className="flex-1 flex flex-col items-center">
          <div 
            className="w-full bg-blue-500 rounded-t"
            style={{ height: `${(item.completed || item.value) * 2}px` }}
          />
          <span className="text-xs text-gray-500 mt-1 truncate">
            {item.date ? new Date(item.date).getDate() : item.name}
          </span>
        </div>
      ))}
    </div>
  );
};

export const PieChart: React.FC<ChartProps> = ({ data, className }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className={`h-64 flex items-center justify-center ${className}`}>
      <div className="relative">
        <div className="w-48 h-48 rounded-full border-8 border-gray-200 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold">{data.reduce((sum, item) => sum + item.value, 0)}</div>
            <div className="text-sm text-gray-500">Total</div>
          </div>
        </div>
        <div className="absolute inset-0 flex flex-col justify-center space-y-2 ml-56">
          {data.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <span className="text-sm">{item.name}: {item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const BarChart: React.FC<ChartProps> = ({ data, className }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(item => item.value));

  return (
    <div className={`h-64 space-y-2 ${className}`}>
      {data.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          <div className="w-20 text-sm truncate">{item.name}</div>
          <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
            <div 
              className="bg-blue-500 h-4 rounded-full flex items-center justify-end pr-2"
              style={{ width: `${(item.value / maxValue) * 100}%` }}
            >
              <span className="text-xs text-white font-medium">{item.value}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
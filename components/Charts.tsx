import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line
} from 'recharts';

const COLORS = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#71717a'];

const getGridColor = () => getComputedStyle(document.documentElement).getPropertyValue('--app-border').trim() || '#e2e8f0';
const getTextColor = () => getComputedStyle(document.documentElement).getPropertyValue('--app-text-muted').trim() || '#94a3b8';
const getCardColor = () => getComputedStyle(document.documentElement).getPropertyValue('--app-card').trim() || '#ffffff';
const getAccentColor = () => getComputedStyle(document.documentElement).getPropertyValue('--app-accent').trim() || '#6366f1';
const getMainTextColor = () => getComputedStyle(document.documentElement).getPropertyValue('--app-text').trim() || '#0f172a';

export const ProductionTrendChart: React.FC<{ data: any[] }> = ({ data }) => {
  const accent = getAccentColor();
  const secondary = '#f43f5e';
  const textMuted = getTextColor();
  const textMain = getMainTextColor();
  const grid = getGridColor();
  const card = getCardColor();

  return (
    <div className="h-72 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 30, right: 10, left: -20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="0" vertical={false} stroke={grid} opacity={0.5} />
          <XAxis 
            dataKey="date" 
            axisLine={{ stroke: textMuted, strokeWidth: 1 }}
            tickLine={false}
            tick={{ fill: textMuted, fontSize: 10, fontWeight: 700 }}
            dy={10}
            interval="preserveStartEnd"
          />
          <YAxis 
            stroke={textMuted} 
            fontSize={10} 
            fontWeight={700}
            tickLine={false} 
            axisLine={false} 
            tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(0)}k` : val} 
            dx={-10}
            label={{ 
              value: 'KG', 
              angle: 0, 
              position: 'top', 
              offset: 20, 
              fill: textMuted, 
              fontSize: 10, 
              fontWeight: 800 
            }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: card, 
              borderRadius: '8px', 
              border: `1px solid ${grid}`, 
              fontSize: '12px',
              fontWeight: 'bold',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
            }}
          />
          <Legend 
            verticalAlign="bottom" 
            align="center" 
            iconType="plainline"
            iconSize={24}
            wrapperStyle={{ 
              paddingTop: '30px', 
              fontSize: '11px', 
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          />
          <Line 
            name="LANTABUR" 
            type="monotone" 
            dataKey="lantabur" 
            stroke={accent} 
            strokeWidth={2.5} 
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
            animationDuration={2000}
          />
          <Line 
            name="TAQWA" 
            type="monotone" 
            dataKey="taqwa" 
            stroke={textMain} 
            strokeWidth={2.5} 
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
            animationDuration={2000}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export const MultiIndustryBarChart: React.FC<{ data: any[] }> = ({ data }) => {
  const accent = getAccentColor();
  const secondary = '#f43f5e';
  const text = getTextColor();
  const grid = getGridColor();
  const card = getCardColor();

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={grid} opacity={0.3} />
          <XAxis dataKey="date" hide />
          <YAxis 
            stroke={text} 
            fontSize={9} 
            tickLine={false} 
            axisLine={false} 
            tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(1)}k` : val}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: card, 
              borderRadius: '4px', 
              border: `1px solid ${grid}`, 
              fontSize: '11px'
            }}
          />
          <Legend 
            wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '15px' }}
            iconType="rect"
            verticalAlign="bottom"
          />
          <Bar name="Lantabur" dataKey="lantabur.total" fill={accent} radius={[2, 2, 0, 0]} barSize={20} />
          <Bar name="Taqwa" dataKey="taqwa.total" fill={secondary} radius={[2, 2, 0, 0]} barSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const ShiftPerformanceChart: React.FC<{ data: any[] }> = ({ data }) => {
  const text = getTextColor();
  const grid = getGridColor();
  const card = getCardColor();

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={grid} opacity={0.3} />
          <XAxis dataKey="date" hide />
          <YAxis 
            stroke={text} 
            fontSize={9} 
            tickLine={false} 
            axisLine={false} 
            tickFormatter={(val) => `${(val/1000).toFixed(0)}k`}
          />
          <Tooltip contentStyle={{ backgroundColor: card, borderRadius: '4px', border: `1px solid ${grid}`, fontSize: '11px' }} />
          <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '10px' }} />
          <Line name="Shift A" type="monotone" dataKey="shiftA" stroke="#6366f1" strokeWidth={3} dot={false} />
          <Line name="Shift B" type="monotone" dataKey="shiftB" stroke="#10b981" strokeWidth={3} dot={false} />
          <Line name="Shift C" type="monotone" dataKey="shiftC" stroke="#f59e0b" strokeWidth={3} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export const IndustryComparisonChart: React.FC<{ data: any[] }> = ({ data }) => {
  const text = getTextColor();
  const grid = getGridColor();
  const card = getCardColor();

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: -10, right: 10 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={grid} opacity={0.3} />
          <XAxis type="number" hide />
          <YAxis 
            dataKey="name" 
            type="category" 
            stroke={text} 
            fontSize={10} 
            tickLine={false} 
            axisLine={false} 
            width={70}
            fontWeight="bold"
          />
          <Tooltip 
             contentStyle={{ backgroundColor: card, borderRadius: '4px', border: `1px solid ${grid}`, fontSize: '11px' }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={30}>
            {data.map((entry, index) => ( entry.color ? <Cell key={index} fill={entry.color} /> : <Cell key={index} fill={index === 0 ? getAccentColor() : '#f43f5e'} /> ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const RadarPerformanceChart: React.FC<{ lantabur: any, taqwa: any }> = ({ lantabur, taqwa }) => {
  const grid = getGridColor();
  const text = getTextColor();
  
  const data = [
    { subject: 'Volume', A: lantabur.total, B: taqwa.total, fullMark: 50000 },
    { subject: 'Inhouse', A: lantabur.inhouse, B: taqwa.inhouse, fullMark: 50000 },
    { subject: 'Capacity', A: lantabur.loadingCap || 0, B: taqwa.loadingCap || 0, fullMark: 100 },
    { subject: 'Variety', A: lantabur.colorGroups.length, B: taqwa.colorGroups.length, fullMark: 12 },
    { subject: 'Efficiency', A: (lantabur.inhouse / lantabur.total) * 100, B: (taqwa.inhouse / taqwa.total) * 100, fullMark: 100 },
  ];

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke={grid} />
          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: text, fontWeight: 'bold' }} />
          <Radar name="Lantabur" dataKey="A" stroke={getAccentColor()} fill={getAccentColor()} fillOpacity={0.4} />
          <Radar name="B" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.4} />
          <Legend wrapperStyle={{ fontSize: 9, fontWeight: 'bold' }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const ColorDistributionChart: React.FC<{ data: any[] }> = ({ data }) => {
  const grid = getGridColor();
  const card = getCardColor();
  const text = getTextColor();
  const sortedData = [...data].sort((a, b) => b.weight - a.weight);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={sortedData} innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="weight" nameKey="groupName" stroke="none">
            {sortedData.map((entry, index) => ( <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} /> ))}
          </Pie>
          <Tooltip contentStyle={{ backgroundColor: card, borderRadius: '4px', border: `1px solid ${grid}`, fontSize: '11px' }} />
          <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: 'bold' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export const ResourceForecastChart: React.FC<{ data: any[] }> = ({ data }) => {
  const grid = getGridColor();
  const text = getTextColor();
  return (
    <div className="h-40 w-full">
       <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={grid} opacity={0.3} />
            <XAxis dataKey="name" hide />
            <YAxis hide />
            <Tooltip contentStyle={{ fontSize: '10px' }} />
            <Bar dataKey="value" fill={getAccentColor()} radius={[2, 2, 0, 0]} />
          </BarChart>
       </ResponsiveContainer>
    </div>
  );
};

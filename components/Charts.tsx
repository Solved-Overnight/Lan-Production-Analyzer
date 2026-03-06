import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, LabelList
} from 'recharts';
import { Download } from 'lucide-react';
import html2canvas from 'html2canvas';

const COLORS = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#71717a'];

const getGridColor = () => getComputedStyle(document.documentElement).getPropertyValue('--app-border').trim() || '#e2e8f0';
const getTextColor = () => getComputedStyle(document.documentElement).getPropertyValue('--app-text-muted').trim() || '#94a3b8';
const getCardColor = () => getComputedStyle(document.documentElement).getPropertyValue('--app-card').trim() || '#ffffff';
const getAccentColor = () => getComputedStyle(document.documentElement).getPropertyValue('--app-accent').trim() || '#6366f1';
const getMainTextColor = () => getComputedStyle(document.documentElement).getPropertyValue('--app-text').trim() || '#0f172a';

export const downloadElementAsImage = async (element: HTMLElement, filename: string) => {
  const btn = element.querySelector('.chart-download-btn') as HTMLElement;
  if (btn) btn.style.display = 'none';

  // Stabilize element for capture to prevent text alignment shifts
  const originalStyle = element.style.cssText;
  const originalWidth = element.offsetWidth;
  element.style.width = `${originalWidth}px`;
  element.style.fontVariantNumeric = 'tabular-nums';
  
  const canvas = await html2canvas(element, {
    scale: 3,
    useCORS: true,
    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--app-card').trim() || '#ffffff',
    logging: false,
    onclone: (clonedDoc, clonedEl) => {
      // Force text rendering to be consistent in the clone
      const svgElements = clonedEl.querySelectorAll('svg');
      svgElements.forEach(svg => {
        svg.setAttribute('shape-rendering', 'geometricPrecision');
        svg.style.overflow = 'visible';
      });
      // Ensure the download button is hidden in clone
      const clonedBtn = clonedEl.querySelector('.chart-download-btn') as HTMLElement;
      if (clonedBtn) clonedBtn.style.display = 'none';
    }
  });

  element.style.cssText = originalStyle;
  if (btn) btn.style.display = 'flex';

  const link = document.createElement('a');
  link.download = `${filename}_${new Date().getTime()}.png`;
  link.href = canvas.toDataURL('image/png', 1.0);
  link.click();
};

export const DownloadButton: React.FC<{ targetRef: React.RefObject<HTMLDivElement | null>, title: string }> = ({ targetRef, title }) => (
  <button 
    onClick={(e) => {
      e.stopPropagation();
      if (targetRef.current) downloadElementAsImage(targetRef.current, title.replace(/\s+/g, '_'));
    }}
    className="chart-download-btn absolute top-2 right-2 p-1.5 bg-app-card/80 hover:bg-app-accent hover:text-white text-app-text-muted rounded-md transition-all opacity-0 group-hover:opacity-100 z-20 border border-app-border shadow-sm flex items-center justify-center"
    title="Download Graph Image"
  >
    <Download size={14} />
  </button>
);

export const ProductionTrendChart: React.FC<{ data: any[] }> = ({ data }) => {
  const accent = getAccentColor();
  const textMuted = getTextColor();
  const textMain = getMainTextColor();
  const grid = getGridColor();
  const card = getCardColor();

  return (
    <div className="h-72 w-full mt-4" data-chart-container="production-trend">
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
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: card, 
              borderRadius: '8px', 
              border: `1px solid ${grid}`, 
              fontSize: '12px',
              fontWeight: 'bold'
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
              textTransform: 'uppercase'
            }}
          />
          <Line name="LANTABUR" type="monotone" dataKey="lantabur" stroke={accent} strokeWidth={2.5} dot={false} animationDuration={2000} />
          <Line name="TAQWA" type="monotone" dataKey="taqwa" stroke={textMain} strokeWidth={2.5} dot={false} animationDuration={2000} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export const IndustryColorComparisonChart: React.FC<{ data: any[], lantaburTotal: number, taqwaTotal: number }> = ({ data, lantaburTotal, taqwaTotal }) => {
  const accent = getAccentColor();
  const secondary = '#f43f5e';
  const grid = getGridColor();
  const card = getCardColor();
  const mainText = getMainTextColor();

  return (
    <div className="h-full w-full" data-chart-container="industry-color">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={data} 
          layout="horizontal"
          margin={{ left: 0, right: 0, top: 40, bottom: 10 }}
          barGap={4}
          barCategoryGap="10%"
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={grid} opacity={0.3} />
          <XAxis 
            dataKey="group" 
            stroke={mainText} 
            fontSize={8} 
            tickLine={false} 
            axisLine={false} 
            fontWeight="900"
            interval={0}
            dy={5}
            tick={{ textAnchor: 'middle' }}
          />
          <YAxis hide />
          <Tooltip 
             cursor={{ fill: 'var(--app-bg)', opacity: 0.4 }}
             contentStyle={{ 
               backgroundColor: card, 
               borderRadius: '8px', 
               border: `1px solid ${grid}`, 
               fontSize: '11px',
               fontWeight: 'bold',
               boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
             }}
             formatter={(value: number, name: string) => {
                const total = name === 'Lantabur' ? lantaburTotal : taqwaTotal;
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                return [`${value.toLocaleString()} kg (${percentage}%)`, ''];
             }}
          />
          <Legend 
            verticalAlign="top" 
            align="right" 
            iconType="circle"
            wrapperStyle={{ 
              fontSize: '10px', 
              fontWeight: '900', 
              paddingBottom: '20px', 
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              top: 5 
            }}
          />
          <Bar 
            name="Lantabur" 
            dataKey="lantabur" 
            fill={accent} 
            radius={[4, 4, 0, 0]} 
            barSize={32} 
            animationDuration={1500}
          >
             <LabelList 
               dataKey="lantabur" 
               position="top" 
               angle={0}
               offset={10}
               style={{ fontSize: '8px', fontWeight: '900', fill: accent, textAnchor: 'middle' }} 
               formatter={(val: number) => {
                 if (val <= 0) return '';
                 const percentage = lantaburTotal > 0 ? ((val / lantaburTotal) * 100).toFixed(1) : '0.0';
                 const kVal = (val/1000).toFixed(1);
                 return `${kVal}k (${percentage}%)`;
               }} 
             />
          </Bar>
          <Bar 
            name="Taqwa" 
            dataKey="taqwa" 
            fill={secondary} 
            radius={[4, 4, 0, 0]} 
            barSize={32} 
            animationDuration={1500}
          >
             <LabelList 
               dataKey="taqwa" 
               position="top" 
               angle={0}
               offset={10}
               style={{ fontSize: '8px', fontWeight: '900', fill: secondary, textAnchor: 'middle' }} 
               formatter={(val: number) => {
                 if (val <= 0) return '';
                 const percentage = taqwaTotal > 0 ? ((val / taqwaTotal) * 100).toFixed(1) : '0.0';
                 const kVal = (val/1000).toFixed(1);
                 return `${kVal}k (${percentage}%)`;
               }} 
             />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const MultiIndustryBarChart: React.FC<{ data: any[] }> = ({ data }) => {
  const accent = getAccentColor();
  const secondary = '#f43f5e';
  const textMuted = getTextColor();
  const mainText = getMainTextColor();
  const grid = getGridColor();
  const card = getCardColor();

  return (
    <div className="h-80 w-full" data-chart-container="multi-industry">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 40, right: 10, left: -20, bottom: 20 }} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={grid} opacity={0.3} />
          <XAxis 
            dataKey="date" 
            stroke={mainText} 
            fontSize={8} 
            tickLine={false} 
            axisLine={false} 
            fontWeight="900"
            dy={10}
            tickFormatter={(val) => {
              try {
                return val.split(' ')[0]; // Show just the day number for cleaner layout
              } catch (e) {
                return val;
              }
            }}
          />
          <YAxis stroke={textMuted} fontSize={9} tickLine={false} axisLine={false} tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(1)}k` : val} />
          <Tooltip 
            cursor={{ fill: 'var(--app-bg)', opacity: 0.4 }}
            contentStyle={{ backgroundColor: card, borderRadius: '8px', border: `1px solid ${grid}`, fontSize: '11px', fontWeight: 'bold' }} 
          />
          <Legend wrapperStyle={{ fontSize: '10px', fontWeight: '900', paddingTop: '30px', textTransform: 'uppercase' }} iconType="circle" verticalAlign="bottom" />
          <Bar name="Lantabur" dataKey="lantabur.total" fill={accent} radius={[4, 4, 0, 0]} barSize={24}>
             <LabelList 
               dataKey="lantabur.total" 
               position="top" 
               style={{ fontSize: '8px', fontWeight: '900', fill: accent }} 
               // Fix: Make props optional in LabelFormatter to satisfy TS and library type definition
               formatter={(val: number, props?: any) => {
                 if (!val || val <= 0 || !props) return '';
                 const item = data[props.index];
                 if (!item) return '';
                 const total = item.totalProduction || (item.lantabur.total + item.taqwa.total);
                 const pct = ((val / total) * 100).toFixed(0);
                 return `${(val/1000).toFixed(1)}k (${pct}%)`;
               }} 
             />
          </Bar>
          <Bar name="Taqwa" dataKey="taqwa.total" fill={secondary} radius={[4, 4, 0, 0]} barSize={24}>
             <LabelList 
               dataKey="taqwa.total" 
               position="top" 
               style={{ fontSize: '8px', fontWeight: '900', fill: secondary }} 
               // Fix: Make props optional in LabelFormatter to satisfy TS and library type definition
               formatter={(val: number, props?: any) => {
                 if (!val || val <= 0 || !props) return '';
                 const item = data[props.index];
                 if (!item) return '';
                 const total = item.totalProduction || (item.lantabur.total + item.taqwa.total);
                 const pct = ((val / total) * 100).toFixed(0);
                 return `${(val/1000).toFixed(1)}k (${pct}%)`;
               }} 
             />
          </Bar>
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
    <div className="h-64 w-full" data-chart-container="shift-performance">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={grid} opacity={0.3} />
          <XAxis dataKey="date" hide />
          <YAxis stroke={text} fontSize={9} tickLine={false} axisLine={false} tickFormatter={(val) => `${(val/1000).toFixed(0)}k`} />
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
    <div className="h-full w-full" data-chart-container="industry-comparison">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: -10, right: 10 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={grid} opacity={0.3} />
          <XAxis type="number" hide />
          <YAxis dataKey="name" type="category" stroke={text} fontSize={10} tickLine={false} axisLine={false} width={70} fontWeight="bold" />
          <Tooltip contentStyle={{ backgroundColor: card, borderRadius: '4px', border: `1px solid ${grid}`, fontSize: '11px' }} />
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
    <div className="h-56 w-full" data-chart-container="radar-performance">
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
  const sortedData = [...data].sort((a, b) => b.weight - a.weight);
  return (
    <div className="h-64 w-full" data-chart-container="color-distribution">
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
  return (
    <div className="h-40 w-full" data-chart-container="resource-forecast">
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

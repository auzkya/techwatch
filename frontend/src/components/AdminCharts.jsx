import { faCircleCheck } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell, Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import './AdminCharts.css';

const COLORS = ['#4A90E2', '#50E3C2', '#F5A623', '#D0021B', '#9013FE', '#7ED321'];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    // Získání data z prvního prvku (všechny v jednom bodě mají stejné datum)
    const dateLabel = payload[0].payload.full_date || payload[0].payload.date;

    return (
      <div className="custom-tooltip" style={{
        backgroundColor: 'rgba(15, 15, 15, 0.95)',
        padding: '12px',
        border: '1px solid #444',
        borderRadius: '8px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
      }}>
        <div style={{
          color: '#888',
          fontSize: '12px',
          marginBottom: '8px',
          borderBottom: '1px solid #333',
          paddingBottom: '4px'
        }}>
          {dateLabel}
        </div>

        <div className="tooltip-items">
          {payload.map((entry, index) => {
            const p = entry.payload;
            const name = entry.name || p?.name || p?.payload?.name;
            const value = entry.value ?? p?.value ?? p?.payload?.value;

            let color = entry.color || entry.fill;
            if (!color || color.includes('url')) {
              color = COLORS[index % COLORS.length];
            }

            return (
              <div key={`tooltip-${index}`} className="tooltip-item" style={{
                color: color,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                marginTop: '4px'
              }}>
                <span style={{ backgroundColor: color, width: '8px', height: '8px', borderRadius: '50%' }}></span>
                <span style={{ color: '#eee' }}>{name}:</span>
                <span style={{ fontWeight: 'bold', color: '#fff' }}>
                  {Number(value).toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

const adjustColor = (hex, percent) => {
  let r = parseInt(hex.substring(1, 3), 16);
  let g = parseInt(hex.substring(3, 5), 16);
  let b = parseInt(hex.substring(5, 7), 16);

  r = parseInt(r * (100 + percent) / 100);
  g = parseInt(g * (100 + percent) / 100);
  b = parseInt(b * (100 + percent) / 100);

  r = (r < 255) ? r : 255;
  g = (g < 255) ? g : 255;
  b = (b < 255) ? b : 255;

  const rr = ((r.toString(16).length === 1) ? "0" + r.toString(16) : r.toString(16));
  const gg = ((g.toString(16).length === 1) ? "0" + g.toString(16) : g.toString(16));
  const bb = ((b.toString(16).length === 1) ? "0" + b.toString(16) : b.toString(16));

  return "#" + rr + gg + bb;
};

const GradientDefinitions = ({ prefix }) => (
  <defs>
    {COLORS.map((color, index) => {
      // Pro efekt podobný AreaChartu použijeme v gradientu barvu vs. světlejší verzi
      const lightColor = color;
      const darkColor = adjustColor(color, -10);

      return (
        <linearGradient
          key={`${prefix}-gradient-${index}`}
          id={`${prefix}-gradient-${index}`}
          x1="0" y1="0" x2="0" y2="1"
        >
          {/* Horní část dílku - jemnější */}
          <stop offset="5%" stopColor={lightColor} stopOpacity={0.6} />
          {/* Spodní část dílku - průhlednější */}
          <stop offset="95%" stopColor={darkColor} stopOpacity={0.2} />
        </linearGradient>
      );
    })}
  </defs>
);

const AdminCharts = ({ data, onRangeChange }) => {
  const [activeRange, setActiveRange] = useState('6months');

  if (!data || !data.chart_data) return null;
  const { timeLine, specs, itemCategories, workersVsItems, authMethods, phoneStats } = data.chart_data;

  const handleRangeClick = (range) => {
    setActiveRange(range);
    // Kontrola: Pokud onRangeChange existuje, zavolej ho
    if (typeof onRangeChange === 'function') {
      onRangeChange(range);
    }
  };

  return (
    <div className="admin-dashboard-wrapper">
      <div className="admin-charts-grid">
        {/* 1 & 3: Časový graf (Sloučený pro přehlednost) */}
        <div className="chart-card full-width">
          <h3>Trend Aktivity (Uživatelé vs Pracovníci vs Technika)</h3>
          <div className="admin-controls">
            <div className="category-grid-activity">
              {[
                { id: 'week', label: '1 týden' },
                { id: 'month', label: '1 měsíc' },
                { id: '6months', label: 'Půl roku' },
                { id: '1year', label: '1 rok' },
                { id: '2years', label: '2 roky' },
                { id: 'all', label: 'Od počátku' }
              ].map((r) => (
                <label key={r.id} className={`checkbox ${activeRange === r.id ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="timeRange"
                    value={r.id}
                    checked={activeRange === r.id}
                    onChange={() => handleRangeClick(r.id)}
                    style={{ display: 'none' }}
                  />
                  <span>
                    {r.label}
                    <FontAwesomeIcon icon={faCircleCheck} className="input-selected-icon" style={{ paddingLeft: '10px' }} />
                  </span>
                </label>
              ))}
            </div>
          </div>
          <div className="chart-container full-width">
            <ResponsiveContainer width="100%" height="100%" key={timeLine.length}>
              <AreaChart data={timeLine}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4A90E2" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#4A90E2" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorWorkers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#50E3C2" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#50E3C2" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorItems" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F5A623" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#F5A623" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#222" />
                <XAxis
                  dataKey="full_date" // ZMĚNA: Použijeme unikátní denní datum pro plynulý pohyb
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#666', fontSize: 11 }}
                  minTickGap={30} // Aby se texty nepřekrývaly
                  tickFormatter={(value) => {
                    // Z "31. 05. 2025" uděláme pro osu jen "05/2025"
                    if (!value) return '';
                    const parts = value.split('. ');
                    return parts.length > 2 ? `${parts[1]}/${parts[2]}` : value;
                  }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#666', fontSize: 11 }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#444', strokeWidth: 1 }} />
                <Legend iconType="circle" />
                <Area type="monotone" name="Celkem uživatelů" dataKey="users" stroke="#4A90E2" fillOpacity={1} fill="url(#colorUsers)" />
                <Area type="monotone" name="Pracovníci" dataKey="workers" stroke="#50E3C2" fillOpacity={1} fill="url(#colorWorkers)" />
                <Area type="monotone" name="Inzeráty" dataKey="items" stroke="#F5A623" fillOpacity={1} fill="url(#colorItems)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2: Pie chart profesí */}
        <div className="chart-card">
          <h3>Specializace uživatelů</h3>
          <PieContainer data={specs} />
        </div>

        {/* 4: Pie chart typů zařízení */}
        <div className="chart-card">
          <h3>Kategorie techniky</h3>
          <PieContainer data={itemCategories} />
        </div>

        {/* 5: Pracovníci vs Nabídky */}
        <div className="chart-card">
          <h3>Pracovní síla vs Technika</h3>
          <PieContainer data={workersVsItems} />
        </div>

        {/* 6: Metody přihlášení */}
        <div className="chart-card">
          <h3>Způsoby registrace</h3>
          <PieContainer data={authMethods} />
        </div>

        {/* 7: Ověřené telefony */}
        <div className="chart-card">
          <h3>Stav ověření telefonů</h3>
          <PieContainer data={phoneStats} />
        </div>

      </div>
    </div>
  );
};

// Pomocná komponenta pro Pie Charty, aby se kód neopakoval
const PieContainer = ({ data }) => {
  const chartId = useState(() => Math.random().toString(36).substr(2, 9))[0];

  if (!data || data.length === 0) return <div className="chart-container">Žádná data</div>;

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <GradientDefinitions prefix={chartId} />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={75}
            outerRadius={110}
            paddingAngle={5} // Větší mezery vypadají s nízkou opacity lépe
            strokeWidth={1.5}
          >
            {data.map((entry, i) => (
              <Cell
                key={`cell-${i}`}
                // Výplň je náš poloprůhledný gradient
                fill={`url(#${chartId}-gradient-${i % COLORS.length})`}
                // Okraj (stroke) uděláme v plné barvě, aby definoval tvar
                stroke={COLORS[i % COLORS.length]}
                style={{
                  outline: 'none',
                  filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.05))'
                }}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AdminCharts;
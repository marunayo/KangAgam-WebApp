// StatisticsPage.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getDashboardData } from '../../services/dashboardService';
import PageHeader from '../../components/ui/PageHeader';
import LoadingIndicator from '../../components/ui/LoadingIndicator';
import ExportControls from '../../components/admin/ExportControls';

import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Helper function to extract topic name
const getTopicName = (nameData) => {
    if (!nameData) return 'N/A';
    if (typeof nameData === 'string') return nameData;
    if (Array.isArray(nameData)) {
        const idName = nameData.find(n => n.lang === 'id');
        if (idName) return idName.value;
        return nameData.length > 0 ? nameData[0].value : 'N/A';
    }
    return 'N/A';
};

// Helper function to create chart gradient
const createGradient = (ctx, area, colorStart, colorEnd) => {
    const gradient = ctx.createLinearGradient(0, area.bottom, 0, area.top);
    gradient.addColorStop(0, colorStart);
    gradient.addColorStop(1, colorEnd);
    return gradient;
};

const StatisticsPage = () => {
    const { user } = useAuth();
    const visitorChartRef = useRef(null);
    const topicChartRef = useRef(null);
    const uniqueVisitorChartRef = useRef(null);
    const cityChartRef = useRef(null);

    const [visitorStats, setVisitorStats] = useState({ total: 0, distribution: [] });
    const [topicStats, setTopicStats] = useState({ favorite: {}, distribution: [] });
    const [uniqueVisitorStats, setUniqueVisitorStats] = useState({ total: 0, distribution: [] });
    const [cityStats, setCityStats] = useState({ mostFrequent: {}, distribution: [] });

    const [filters, setFilters] = useState({
        visitorsPeriod: 'monthly',
        uniqueVisitorsPeriod: 'monthly',
        topicPeriod: 'monthly',
        cityPeriod: 'monthly',
    });

    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [loadingStates, setLoadingStates] = useState({
        visitors: false,
        uniqueVisitors: false,
        topics: false,
        cities: false,
    });
    const [error, setError] = useState(null);

    const fetchCardData = useCallback(async (cardType, currentFilters) => {
        if (!user?.token) return;
        setLoadingStates(prev => ({ ...prev, [cardType]: true }));
        try {
            const data = await getDashboardData(currentFilters, user.token);
            switch (cardType) {
                case 'visitors':
                    setVisitorStats({ total: data.totalVisitors, distribution: data.visitorDistribution });
                    break;
                case 'uniqueVisitors':
                    setUniqueVisitorStats({ total: data.totalUniqueVisitors, distribution: data.uniqueVisitorDistribution });
                    break;
                case 'topics':
                    setTopicStats({ favorite: data.favoriteTopic, distribution: data.topicDistribution });
                    break;
                case 'cities':
                    setCityStats({ mostFrequent: data.mostfrequentcity, distribution: data.cityDistribution });
                    break;
                default:
                    break;
            }
        } catch (err) {
            setError(`Gagal memuat data untuk kartu ${cardType}.`);
            console.error(err);
        } finally {
            setLoadingStates(prev => ({ ...prev, [cardType]: false }));
        }
    }, [user]);

    useEffect(() => {
        const fetchInitialData = async () => {
            if (!user?.token) return;
            setIsInitialLoading(true);
            try {
                const data = await getDashboardData(filters, user.token);
                setVisitorStats({ total: data.totalVisitors, distribution: data.visitorDistribution });
                setUniqueVisitorStats({ total: data.totalUniqueVisitors, distribution: data.uniqueVisitorDistribution });
                setTopicStats({ favorite: data.favoriteTopic, distribution: data.topicDistribution });
                setCityStats({ mostFrequent: data.mostfrequentcity, distribution: data.cityDistribution });
                setError(null);
            } catch (err) {
                setError('Gagal memuat data statistik awal.');
                console.error(err);
            } finally {
                setIsInitialLoading(false);
            }
        };
        fetchInitialData();
    }, [user]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        const newFilters = { ...filters, [name]: value };
        setFilters(newFilters);
        
        // Map frontend filter names to card types
        const cardTypeMap = {
            visitorsPeriod: 'visitors',
            uniqueVisitorsPeriod: 'uniqueVisitors',
            topicPeriod: 'topics',
            cityPeriod: 'cities',
        };
        
        const cardType = cardTypeMap[name];
        fetchCardData(cardType, newFilters);
    };

    const visitorChartData = {
        labels: visitorStats.distribution?.map(d => d.label) || [],
        datasets: [{
            label: 'Total Kunjungan',
            data: visitorStats.distribution?.map(d => d.count) || [],
            backgroundColor: (context) => {
                const { ctx, chartArea } = context.chart;
                if (!chartArea) return 'rgba(124, 58, 237, 0.5)';
                return createGradient(ctx, chartArea, '#A78BFA80', '#7C3AED');
            },
            borderColor: '#7C3AED',
            borderWidth: 1,
            borderRadius: 8,
        }],
    };

    const topicChartData = {
        labels: topicStats.distribution?.map(d => getTopicName(d.name)) || [],
        datasets: [{
            label: 'Jumlah Kunjungan',
            data: topicStats.distribution?.map(d => d.count) || [],
            backgroundColor: (context) => {
                const { ctx, chartArea } = context.chart;
                if (!chartArea) return 'rgba(245, 158, 11, 0.5)';
                return createGradient(ctx, chartArea, '#FBBF2480', '#F59E0B');
            },
            borderColor: '#F59E0B',
            borderWidth: 1,
            borderRadius: 8,
        }],
    };

    const uniqueVisitorChartData = {
        labels: uniqueVisitorStats.distribution?.map(d => d.label) || [],
        datasets: [{
            label: 'Pengunjung Unik',
            data: uniqueVisitorStats.distribution?.map(d => d.count) || [],
            backgroundColor: (context) => {
                const { ctx, chartArea } = context.chart;
                if (!chartArea) return 'rgba(5, 150, 105, 0.5)';
                return createGradient(ctx, chartArea, '#34D39980', '#059669');
            },
            borderColor: '#059669',
            borderWidth: 1,
            borderRadius: 8,
        }],
    };

    const cityChartData = {
        labels: cityStats.distribution?.map(d => d.label) || [],
        datasets: [{
            label: 'Jumlah Pengunjung',
            data: cityStats.distribution?.map(d => d.count) || [],
            backgroundColor: (context) => {
                const { ctx, chartArea } = context.chart;
                if (!chartArea) return 'rgba(236, 72, 153, 0.5)';
                return createGradient(ctx, chartArea, '#F472B680', '#EC4899');
            },
            borderColor: '#EC4899',
            borderWidth: 1,
            borderRadius: 8,
        }],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            y: { beginAtZero: true, grid: { display: false }, ticks: { color: 'rgb(var(--color-text-secondary))', precision: 0 } },
            x: { grid: { display: false }, ticks: { color: 'rgb(var(--color-text-secondary))' } },
        },
    };

    const mostFrequentCityName = cityStats.distribution && cityStats.distribution.length > 0
        ? cityStats.distribution[0].label
        : 'N/A';

    if (isInitialLoading) return <div className="flex items-center justify-center h-96"><LoadingIndicator /></div>;
    if (error && !visitorStats.distribution) return <p className="text-center text-red-500">{error}</p>;

    return (
        <div>
            <PageHeader title="Statistik Pengguna">
                <ExportControls 
                    visitorData={visitorStats}
                    topicData={topicStats}
                    uniqueVisitorData={uniqueVisitorStats}
                    cityData={cityStats}
                    filters={filters}
                    visitorChartRef={visitorChartRef}
                    topicChartRef={topicChartRef}
                    uniqueVisitorChartRef={uniqueVisitorChartRef}
                    cityChartRef={cityChartRef}
                />
            </PageHeader>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                {/* Card Total Kunjungan */}
                <div className="bg-background-secondary p-6 rounded-xl shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-text">Total Kunjungan</h3>
                        <select name="visitorsPeriod" value={filters.visitorsPeriod} onChange={handleFilterChange} className="bg-background text-text-secondary rounded-lg px-3 py-1 text-sm border border-gray-300 dark:border-gray-600">
                            <option value="daily">Harian</option>
                            <option value="weekly">Mingguan</option>
                            <option value="monthly">Bulanan</option>
                            <option value="yearly">Tahunan</option>
                        </select>
                    </div>
                    {loadingStates.visitors ? (
                        <div className="h-72 flex items-center justify-center"><LoadingIndicator /></div>
                    ) : (
                        <>
                            <p className="text-5xl font-bold text-text">{visitorStats.total.toLocaleString('id-ID')}</p>
                            <div className="mt-4 h-60">
                                <Bar ref={visitorChartRef} options={chartOptions} data={visitorChartData} />
                            </div>
                        </>
                    )}
                </div>

                {/* Card Topik Favorit */}
                <div className="bg-background-secondary p-6 rounded-xl shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-text">Topik Favorit</h3>
                        <select name="topicPeriod" value={filters.topicPeriod} onChange={handleFilterChange} className="bg-background text-text-secondary rounded-lg px-3 py-1 text-sm border border-gray-300 dark:border-gray-600">
                            <option value="daily">Harian</option>
                            <option value="weekly">Mingguan</option>
                            <option value="monthly">Bulanan</option>
                            <option value="yearly">Tahunan</option>
                        </select>
                    </div>
                    {loadingStates.topics ? (
                        <div className="h-72 flex items-center justify-center"><LoadingIndicator /></div>
                    ) : (
                        <>
                            <p className="text-3xl font-bold text-text">{getTopicName(topicStats.favorite?.name)}</p>
                            <div className="mt-4 h-60">
                                <Bar ref={topicChartRef} options={chartOptions} data={topicChartData} />
                            </div>
                        </>
                    )}
                </div>

                {/* Card Pengunjung Unik */}
                <div className="bg-background-secondary p-6 rounded-xl shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-text">Total Pengunjung</h3>
                        <select name="uniqueVisitorsPeriod" value={filters.uniqueVisitorsPeriod} onChange={handleFilterChange} className="bg-background text-text-secondary rounded-lg px-3 py-1 text-sm border border-gray-300 dark:border-gray-600">
                            <option value="daily">Harian</option>
                            <option value="weekly">Mingguan</option>
                            <option value="monthly">Bulanan</option>
                            <option value="yearly">Tahunan</option>
                        </select>
                    </div>
                    {loadingStates.uniqueVisitors ? (
                        <div className="h-72 flex items-center justify-center"><LoadingIndicator /></div>
                    ) : (
                        <>
                            <p className="text-5xl font-bold text-text">{uniqueVisitorStats.total.toLocaleString('id-ID')}</p>
                            <div className="mt-4 h-60">
                                <Bar ref={uniqueVisitorChartRef} options={chartOptions} data={uniqueVisitorChartData} />
                            </div>
                        </>
                    )}
                </div>

                {/* Card Asal Domisili */}
                <div className="bg-background-secondary p-6 rounded-xl shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-text">Domisili Pengunjung Terbanyak</h3>
                        <select name="cityPeriod" value={filters.cityPeriod} onChange={handleFilterChange} className="bg-background text-text-secondary rounded-lg px-3 py-1 text-sm border border-gray-300 dark:border-gray-600">
                            <option value="daily">Harian</option>
                            <option value="weekly">Mingguan</option>
                            <option value="monthly">Bulanan</option>
                            <option value="yearly">Tahunan</option>
                        </select>
                    </div>
                    {loadingStates.cities ? (
                        <div className="h-72 flex items-center justify-center"><LoadingIndicator /></div>
                    ) : (
                        <>
                            <p className="text-3xl font-bold text-text capitalize">{mostFrequentCityName}</p>
                            <div className="mt-4 h-60">
                                <Bar ref={cityChartRef} options={chartOptions} data={cityChartData} />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StatisticsPage;
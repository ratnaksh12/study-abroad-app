'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Lock, Star, ChevronRight, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';

interface University {
    id: string;
    name: string;
    location: string;
    country: string;
    acceptanceRate: string;
    rank: 'Dream' | 'Target' | 'Safe';
    tags: string[];
}

export default function UniversitiesPage() {
    const [search, setSearch] = useState('');
    const [universities, setUniversities] = useState<University[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('all');
    const router = useRouter();

    useEffect(() => {
        // Mock API call
        setTimeout(() => {
            setUniversities([
                { id: '1', name: 'Stanford University', location: 'California', country: 'USA', acceptanceRate: '4%', rank: 'Dream', tags: ['Top Tier', 'Research'] },
                { id: '2', name: 'University of Toronto', location: 'Toronto', country: 'Canada', acceptanceRate: '43%', rank: 'Target', tags: ['Public', 'Diverse'] },
                { id: '3', name: 'Arizona State University', location: 'Phoenix', country: 'USA', acceptanceRate: '88%', rank: 'Safe', tags: ['Large', 'Warm'] },
                { id: '4', name: 'Imperial College London', location: 'London', country: 'UK', acceptanceRate: '15%', rank: 'Dream', tags: ['STEM', 'Urban'] },
                { id: '5', name: 'Technical University of Munich', location: 'Munich', country: 'Germany', acceptanceRate: '8%', rank: 'Target', tags: ['Engineering', 'Free Tuition'] },
            ]);
            setLoading(false);
        }, 1000);
    }, []);

    const handleLock = async (uni: University) => {
        if (!confirm(`Are you sure you want to LOCK ${uni.name}? This will commit you to this application.`)) return;

        setActionLoading(uni.id);
        try {
            const session = JSON.parse(localStorage.getItem('session') || '{}');
            const email = session.email;

            const res = await fetch('/api/user/universities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'LOCK',
                    universityId: uni.id,
                    universityName: uni.name,
                    universityCountry: uni.country,
                    email
                })
            });

            if (res.ok) {
                alert('University Locked Successfully! Redirecting to Application Guidance...');
                router.push('/guidance');
            } else {
                alert('Failed to lock university.');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setActionLoading(null);
        }
    };

    const filtered = universities.filter(u => u.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="min-h-screen bg-muted/20 pb-20">
            <div className="bg-white border-b px-6 py-4 sticky top-0 z-30 flex items-center justify-between">
                <h1 className="text-xl font-bold flex items-center gap-2">
                    University Discovery
                </h1>
                <div className="flex items-center gap-2">
                    {['All', 'Shortlisted', 'Locked'].map(tab => (
                        <Button
                            key={tab}
                            variant={activeTab === tab.toLowerCase() ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setActiveTab(tab.toLowerCase())}
                        >
                            {tab}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="max-w-5xl mx-auto p-6 space-y-6">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <Input
                        placeholder="Search universities, countries, or programs..."
                        className="pl-10 h-12 text-lg rounded-xl shadow-sm"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                {/* Results */}
                {loading ? (
                    <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>
                ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                        {filtered.map((uni, i) => (
                            <motion.div
                                key={uni.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <Card className="hover:shadow-lg transition-all cursor-pointer group border-l-4 border-l-transparent hover:border-l-primary overflow-hidden">
                                    <CardContent className="p-0">
                                        <div className="p-5">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <div className={`text-xs font-bold px-2 py-1 rounded inline-block mb-2 ${uni.rank === 'Dream' ? 'bg-purple-100 text-purple-600' :
                                                            uni.rank === 'Target' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                                                        }`}>
                                                        {uni.rank}
                                                    </div>
                                                    <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{uni.name}</h3>
                                                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                        <MapPin size={14} /> {uni.location}, {uni.country}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="block text-xl font-bold">{uni.acceptanceRate}</span>
                                                    <span className="text-xs text-muted-foreground">Acceptance</span>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-2 mt-4">
                                                {uni.tags.map(tag => (
                                                    <span key={tag} className="text-xs bg-muted px-2 py-1 rounded-md text-muted-foreground">#{tag}</span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="bg-muted/50 p-3 flex justify-between items-center border-t">
                                            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                                                View Details
                                            </Button>
                                            <div className="flex gap-2">
                                                <Button variant="outline" size="sm" className="gap-1">
                                                    <Star size={14} /> Shortlist
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="gap-1 bg-black text-white hover:bg-black/80"
                                                    onClick={() => handleLock(uni)}
                                                    disabled={actionLoading === uni.id}
                                                >
                                                    {actionLoading === uni.id ? <Loader2 className="animate-spin" size={14} /> : <Lock size={14} />}
                                                    Lock
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

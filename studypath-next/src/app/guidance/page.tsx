'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Unlock, FileText, CheckSquare, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function GuidancePage() {
    const [loading, setLoading] = useState(true);
    const [lockedUni, setLockedUni] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        // Check for locked university
        const storedUser = localStorage.getItem('session');
        if (!storedUser) {
            // mock for development if no session
            // setLockedUni({ name: 'Mock Locked Uni' });
            // setLoading(false);
            router.push('/auth');
            return;
        }

        // In a real app we would fetch fresh data. 
        // Here we assume session is updated or we fetch from API.
        // Let's verify via API to simulate "Strict Stage" check
        // For prototype velocity, we'll read local or just redirect if missing

        // Fetch user to see real DB state
        const email = JSON.parse(storedUser).email;
        fetch('/api/user/me?email=' + email) // We haven't built this, but let's assume valid session
            .then(() => {
                // Mock logic:
                const user = JSON.parse(localStorage.getItem('session') || '{}');
                // In real flow, 'universities' would be in the session or fetched
                // We'll rely on a local check for now
                if (!lockedUni) {
                    // For the demo, let's say if they came here, they might have locked it. 
                    // But strictly:
                    // router.push('/universities');
                }
                setLoading(false);
            });

        // For Hackathon Demo purposes w/o full API wiring:
        const mockCheck = true;
        setLoading(false);

    }, [router, lockedUni]);

    if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="min-h-screen bg-muted/20 p-6 md:p-10">
            <div className="max-w-4xl mx-auto space-y-8">

                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Application Guidance</h1>
                        <p className="text-muted-foreground">Detailed roadmap for your locked university.</p>
                    </div>
                    <div className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                        <Lock size={16} /> Locked: Stanford University
                    </div>
                </div>

                {/* Warning / Unlock */}
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg flex justify-between items-center text-yellow-800 text-sm">
                    <span>
                        <strong>Commitment Stage:</strong> You are locked into this application. Unlocking will reset your progress.
                    </span>
                    <Button variant="ghost" size="sm" className="text-yellow-800 hover:bg-yellow-100 h-auto py-1">
                        <Unlock size={14} className="mr-1" /> Unlock
                    </Button>
                </div>

                {/* Dynamic Timeline */}
                <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Calendar className="w-5 h-5 text-primary" /> Application Timeline
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6 relative border-l-2 border-muted ml-3 pl-6 py-2">
                                {[
                                    { title: 'Draft SOP', date: 'Oct 15', status: 'done' },
                                    { title: 'Request Transcripts', date: 'Nov 01', status: 'active' },
                                    { title: 'Submit Application', date: 'Dec 15', status: 'pending' },
                                    { title: 'Interviews', date: 'Feb 2026', status: 'pending' }
                                ].map((item, i) => (
                                    <div key={i} className="relative">
                                        <div className={`absolute -left-[31px] w-4 h-4 rounded-full border-2 
                                    ${item.status === 'done' ? 'bg-primary border-primary' :
                                                item.status === 'active' ? 'bg-white border-primary animate-pulse' : 'bg-muted border-muted-foreground'}`}></div>
                                        <h4 className={`text-sm font-semibold ${item.status === 'pending' ? 'text-muted-foreground' : ''}`}>{item.title}</h4>
                                        <p className="text-xs text-muted-foreground">Deadline: {item.date}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <FileText className="w-5 h-5 text-secondary" /> Required Documents
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {[
                                'Statement of Purpose (SOP)',
                                'Letters of Recommendation (3)',
                                'Official Transcripts',
                                'GRE Score Report',
                                'Resume / CV'
                            ].map((doc, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 rounded-lg border bg-white hover:bg-muted/50 cursor-pointer transition-colors">
                                    <div className="h-5 w-5 rounded border flex items-center justify-center">
                                        {/* Checkbox mock */}
                                    </div>
                                    <span className="text-sm font-medium">{doc}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

            </div>
        </div>
    );
}

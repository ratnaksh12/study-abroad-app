'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { GraduationCap, CheckCircle, Clock, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { getProfile } from '@/app/actions/profile';

export default function DashboardPage() {
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            const stored = localStorage.getItem('session');
            if (!stored) {
                router.push('/auth');
                return;
            }

            try {
                const parsedUser = JSON.parse(stored);
                setUser(parsedUser);

                // Fetch Profile from Server Action
                const { success, profile } = await getProfile(parsedUser.email);
                if (success) {
                    setProfile(profile);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        checkAuth();
    }, [router]);

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen text-primary"><Loader2 className="animate-spin" /></div>;
    }

    const isComplete = profile?.profileComplete || profile?.isComplete;
    const completionPercentage = isComplete ? 100 : (profile?.educationLevel ? 50 : 0);
    const intakeYear = profile?.intakeYear || '2026';

    return (
        <div className="min-h-screen bg-muted/20 p-6 md:p-10">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                        <p className="text-muted-foreground">Welcome back, {user?.name || 'User'}. Here's your study abroad roadmap for {intakeYear}.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={() => router.push('/counsellor')} variant="default" className="shadow-lg hover:shadow-xl transition-all">
                            <BotIcon className="mr-2 w-4 h-4" /> Talk to Counsellor
                        </Button>
                    </div>
                </div>

                {/* Status Cards */}
                <div className="grid md:grid-cols-3 gap-6">
                    <Card className="glass border-l-4 border-l-blue-500">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Profile Status</CardTitle>
                            <CheckCircle className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{isComplete ? 'Complete' : 'In Progress'}</div>
                            <p className="text-xs text-muted-foreground mt-1">{completionPercentage}% Complete</p>
                            <div className="h-2 w-full bg-muted mt-3 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${completionPercentage}%` }} />
                            </div>
                            {!isComplete && (
                                <Button variant="link" className="p-0 h-auto font-normal text-xs mt-2" onClick={() => router.push('/onboarding')}>
                                    Complete Profile <ArrowRight className="ml-1 w-3 h-3" />
                                </Button>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="glass border-l-4 border-l-orange-500">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Next Milestone</CardTitle>
                            <Clock className="h-4 w-4 text-orange-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">University Shortlist</div>
                            <p className="text-xs text-muted-foreground mt-1">Targeting {intakeYear} Intake</p>
                            <Button variant="link" className="p-0 h-auto font-normal text-xs mt-2" onClick={() => router.push('/counsellor')}>
                                Ask AI for List <ArrowRight className="ml-1 w-3 h-3" />
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="glass border-l-4 border-l-green-500">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Admissions Forecast</CardTitle>
                            <GraduationCap className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{profile?.gpa ? 'Calculated' : 'Pending Data'}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {profile?.gpa ? `Based on GPA: ${profile.gpa}` : 'Add GPA for prediction'}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Content Area */}
                <div className="grid md:grid-cols-3 gap-8">
                    {/* Tasks */}
                    <div className="md:col-span-2 space-y-6">
                        <h2 className="text-xl font-semibold">Recommended Actions</h2>
                        <div className="space-y-4">
                            {!isComplete && (
                                <Card className="hover:shadow-md transition-shadow cursor-pointer border-dashed border-2">
                                    <CardContent className="p-4 flex items-center gap-4 justify-center text-muted-foreground" onClick={() => router.push('/onboarding')}>
                                        Finish Onboarding to see personalized tasks
                                    </CardContent>
                                </Card>
                            )}

                            <Card className="hover:shadow-md transition-shadow cursor-pointer">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-red-100 text-red-600">
                                        <AlertCircle size={16} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-medium">Complete Draft of Statement of Purpose</h4>
                                        <p className="text-sm text-muted-foreground">AI Review pending</p>
                                    </div>
                                    <Button variant="ghost" size="sm">Start</Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* AI Insight */}
                    <div>
                        <Card className="bg-primary text-primary-foreground h-full overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BotIcon className="w-5 h-5" /> AI Insight
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="relative z-10 space-y-4">
                                <p className="text-sm leading-relaxed opacity-90">
                                    {profile?.preferredCountries?.includes('Germany')
                                        ? "Since you selected Germany, remember that public universities often require German proficiency (B1/B2) even for English programs. I can help you find exemptions."
                                        : "Based on your profile, you are a strong candidate for scholarship programs. Chat with me to discover them."}
                                </p>
                                <Button variant="secondary" className="w-full shadow-lg" onClick={() => router.push('/counsellor')}>
                                    Chat with Counsellor
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}

function BotIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 8V4H8" />
            <rect width="16" height="12" x="4" y="8" rx="2" />
            <path d="M2 14h2" />
            <path d="M20 14h2" />
            <path d="M15 13v2" />
            <path d="M9 13v2" />
        </svg>
    )
}

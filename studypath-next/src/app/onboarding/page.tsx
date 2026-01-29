'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, CheckCircle, GraduationCap, Globe, DollarSign, BookOpen, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { updateProfile } from '@/app/actions/profile';
import { cn } from '@/lib/utils'; // Assuming utils exists

// Steps
const STEPS = [
    { id: 1, title: 'Profile', icon: GraduationCap },
    { id: 2, title: 'Discovery', icon: Globe },
    { id: 3, title: 'Finalization', icon: BookOpen },
    { id: 4, title: 'Application', icon: CheckCircle },
];

export default function OnboardingPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [userEmail, setUserEmail] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        educationLevel: '',
        degreeMajor: 'Computer Science', // aligned with schema
        gpa: '',
        intendedDegree: 'Master\'s', // aligned with schema
        intakeYear: '2027',
        budgetRange: '50000', // aligned with schema
        preferredCountries: [] as string[],
        examScores: '',
    });

    useEffect(() => {
        const stored = localStorage.getItem('session');
        if (stored) {
            const parsed = JSON.parse(stored);
            setUserEmail(parsed.email);
        } else {
            router.push('/auth');
        }
    }, [router]);

    const handleNext = async () => {
        if (step < 3) {
            setStep(step + 1);
        } else {
            // Submit
            setLoading(true);
            const res = await updateProfile(userEmail, {
                ...formData,
                profileComplete: true,
                stage: 'discover'
            });

            if (res.success) {
                // Determine next step (Dashboard)
                setTimeout(() => {
                    router.push('/dashboard');
                }, 1000);
            } else {
                alert('Failed to save profile. Please try again.');
                setLoading(false);
            }
        }
    };

    const toggleCountry = (country: string) => {
        setFormData(prev => {
            const exists = prev.preferredCountries.includes(country);
            if (exists) return { ...prev, preferredCountries: prev.preferredCountries.filter(c => c !== country) };
            return { ...prev, preferredCountries: [...prev.preferredCountries, country] };
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-4xl space-y-8">

                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Welcome back!</h1>
                    <p className="text-muted-foreground">Complete your academic profile to get AI-powered recommendations.</p>
                </div>

                {/* Progress Steps */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border flex items-center justify-between px-10 relative overflow-hidden">
                    {STEPS.map((s, i) => (
                        <div key={s.id} className="flex flex-col items-center relative z-10 gap-2">
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2",
                                step >= s.id ? "bg-primary border-primary text-white shadow-md" : "bg-white border-slate-200 text-slate-400"
                            )}>
                                <s.icon size={18} />
                            </div>
                            <span className={cn("text-xs font-semibold transition-colors", step >= s.id ? "text-primary" : "text-muted-foreground")}>{s.title}</span>
                        </div>
                    ))}
                    {/* Progress Bar Line */}
                    <div className="absolute top-9 left-0 w-full h-0.5 bg-slate-100 -z-0">
                        <motion.div
                            className="h-full bg-primary"
                            initial={{ width: '0%' }}
                            animate={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Main Card */}
                <Card className="border-0 shadow-xl overflow-hidden glass min-h-[400px]">
                    <CardContent className="p-8">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={step}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-6"
                            >
                                {step === 1 && (
                                    <div className="space-y-6">
                                        <div className="space-y-1">
                                            <h2 className="text-2xl font-semibold">Education Background</h2>
                                            <p className="text-sm text-muted-foreground">Tell us about your current academic standing.</p>
                                        </div>

                                        <div className="grid gap-4">
                                            <div className="grid gap-2">
                                                <label className="text-sm font-medium">Current Education Level</label>
                                                <select
                                                    className="flex h-12 w-full items-center justify-between rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                    value={formData.educationLevel}
                                                    onChange={(e) => setFormData({ ...formData, educationLevel: e.target.value })}
                                                >
                                                    <option value="">Select Level</option>
                                                    <option value="High School">High School</option>
                                                    <option value="Bachelor's Degree">Bachelor's Degree</option>
                                                    <option value="Master's Degree">Master's Degree</option>
                                                </select>
                                            </div>

                                            <div className="grid gap-2">
                                                <label className="text-sm font-medium">Field of Study</label>
                                                <Input
                                                    placeholder="e.g. Computer Science"
                                                    value={formData.degreeMajor}
                                                    onChange={e => setFormData({ ...formData, degreeMajor: e.target.value })}
                                                    className="h-12 rounded-xl"
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 gap-4">
                                                <div className="grid gap-2">
                                                    <label className="text-sm font-medium">GPA</label>
                                                    <Input
                                                        placeholder="e.g. 3.8 / 4.0"
                                                        value={formData.gpa}
                                                        onChange={e => setFormData({ ...formData, gpa: e.target.value })}
                                                        className="h-12 rounded-xl"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {step === 2 && (
                                    <div className="space-y-6">
                                        <div className="space-y-1">
                                            <h2 className="text-2xl font-semibold">Your Goals</h2>
                                            <p className="text-sm text-muted-foreground">What are you aiming for?</p>
                                        </div>

                                        <div className="grid gap-6">
                                            <div className="grid gap-2">
                                                <label className="text-sm font-medium">Target Intake Year</label>
                                                <div className="grid grid-cols-3 gap-3">
                                                    {['2026', '2027', '2028'].map(year => (
                                                        <button
                                                            key={year}
                                                            onClick={() => setFormData({ ...formData, intakeYear: year })}
                                                            className={cn(
                                                                "h-12 rounded-xl border text-sm font-medium transition-all hover:border-primary",
                                                                formData.intakeYear === year ? "bg-primary text-white border-primary shadow-lg" : "bg-white text-slate-700"
                                                            )}
                                                        >
                                                            {year}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="grid gap-2">
                                                <label className="text-sm font-medium">Annual Budget (USD)</label>
                                                <div className="relative">
                                                    <DollarSign className="absolute left-3 top-3.5 text-muted-foreground h-5 w-5" />
                                                    <Input
                                                        type="number"
                                                        className="pl-10 h-12 rounded-xl"
                                                        placeholder="50000"
                                                        value={formData.budgetRange}
                                                        onChange={e => setFormData({ ...formData, budgetRange: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid gap-2">
                                                <label className="text-sm font-medium">Preferred Countries</label>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                    {['USA', 'UK', 'Canada', 'Germany', 'Australia', 'Singapore'].map(country => (
                                                        <button
                                                            key={country}
                                                            onClick={() => toggleCountry(country)}
                                                            className={cn(
                                                                "h-10 rounded-lg border text-xs font-medium transition-all",
                                                                formData.preferredCountries.includes(country)
                                                                    ? "bg-indigo-50 border-indigo-500 text-indigo-700"
                                                                    : "bg-white hover:bg-slate-50"
                                                            )}
                                                        >
                                                            {country}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {step === 3 && (
                                    <div className="space-y-6">
                                        <div className="space-y-1">
                                            <h2 className="text-2xl font-semibold">Almost Done</h2>
                                            <p className="text-sm text-muted-foreground">Review your profile before we start.</p>
                                        </div>

                                        <div className="bg-slate-50 p-6 rounded-2xl space-y-4 border">
                                            <div className="flex justify-between items-center border-b pb-4">
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Target</p>
                                                    <p className="font-semibold">{formData.intendedDegree} in {formData.degreeMajor}</p>
                                                </div>
                                                <GraduationCap className="text-primary h-5 w-5" />
                                            </div>
                                            <div className="flex justify-between items-center border-b pb-4">
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Budget & Year</p>
                                                    <p className="font-semibold">${formData.budgetRange}/yr • {formData.intakeYear}</p>
                                                </div>
                                                <DollarSign className="text-green-600 h-5 w-5" />
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Countries</p>
                                                    <p className="font-semibold">{formData.preferredCountries.join(', ') || 'Any'}</p>
                                                </div>
                                                <Globe className="text-blue-500 h-5 w-5" />
                                            </div>
                                        </div>

                                        <div className="bg-blue-50 p-4 rounded-xl flex gap-3 items-start text-blue-700 text-sm">
                                            <div className="mt-1">
                                                <CheckCircle size={16} />
                                            </div>
                                            <p>Our AI Counsellor will use this data to calculate your acceptance chances accurately.</p>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </CardContent>
                </Card>

                {/* Footer Actions */}
                <div className="flex justify-between items-center pt-4">
                    <Button
                        variant="ghost"
                        onClick={() => step > 1 && setStep(step - 1)}
                        disabled={step === 1}
                        className="text-muted-foreground"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>

                    <Button
                        onClick={handleNext}
                        className="rounded-xl px-8 h-12 shadow-lg shadow-primary/25"
                        disabled={loading}
                    >
                        {loading ? 'Saving...' : step === 3 ? 'Complete Profile' : 'Continue'}
                        {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                    </Button>
                </div>

            </div>
        </div>
    );
}

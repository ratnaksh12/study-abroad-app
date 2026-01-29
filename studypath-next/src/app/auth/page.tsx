'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { GraduationCap, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function AuthContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';
    const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
    const [isLoading, setIsLoading] = useState(false);

    // Form states
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // TODO: Integrate with real API
        // Mock delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Simulation of auth success
        const userData = {
            id: 'mock_id_' + Date.now(),
            name: mode === 'signup' ? name : 'Test User',
            email,
            token: 'mock_jwt_token'
        };

        // Save minimal session (mock)
        localStorage.setItem('session', JSON.stringify(userData));
        localStorage.setItem('currentUser', email);

        // Redirect to Dashboard (or Onboarding if new)
        if (mode === 'signup') {
            router.push('/onboarding?new=true');
        } else {
            router.push('/dashboard');
        }
    };

    return (
        <div className="w-full max-w-md animate-in fade-in zoom-in duration-300">
            <div className="text-center mb-8">
                <Link href="/" className="inline-flex items-center gap-2 mb-4 hover:scale-105 transition-transform">
                    <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white shadow-lg">
                        <GraduationCap size={24} />
                    </div>
                    <span className="text-2xl font-bold tracking-tight">StudyPath</span>
                </Link>
                <h1 className="text-2xl font-semibold tracking-tight">
                    {mode === 'login' ? 'Welcome back' : 'Create an account'}
                </h1>
                <p className="text-sm text-muted-foreground mt-2">
                    {mode === 'login'
                        ? 'Enter your credentials to access your account'
                        : 'Enter your details to start your journey'}
                </p>
            </div>

            <Tabs value={mode} onValueChange={(v) => setMode(v as 'login' | 'signup')} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>

                <Card className="glass border-white/20">
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {mode === 'signup' && (
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="John Doe"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Password</Label>
                                    {mode === 'login' && (
                                        <Link href="#" className="text-xs text-primary hover:underline">
                                            Forgot password?
                                        </Link>
                                    )}
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>

                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Please wait
                                    </>
                                ) : (
                                    <>
                                        {mode === 'login' ? 'Sign In' : 'Create Account'}
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="flex justify-center border-t p-4 bg-muted/50">
                        <p className="text-xs text-muted-foreground text-center">
                            By clicking continue, you agree to our <br />
                            <Link href="#" className="underline hover:text-primary">Terms of Service</Link> and <Link href="#" className="underline hover:text-primary">Privacy Policy</Link>.
                        </p>
                    </CardFooter>
                </Card>
            </Tabs>
        </div>
    );
}

export default function AuthPage() {
    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            {/* Left Side - Visual */}
            <div className="hidden lg:flex flex-col bg-muted text-white p-10 relative overflow-hidden">
                <div className="absolute inset-0 bg-primary"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10"></div>

                {/* Abstract Shapes */}
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[500px] h-[500px] bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-secondary/20 rounded-full blur-3xl"></div>

                <div className="relative z-20 flex items-center gap-2 font-bold text-xl mb-10">
                    <GraduationCap /> StudyPath
                </div>

                <div className="relative z-20 mt-auto mb-20">
                    <div className="glass p-8 rounded-2xl max-w-md border border-white/10 bg-white/5 backdrop-blur-xl">
                        <blockquote className="space-y-2">
                            <p className="text-lg">
                                &ldquo;This platform completely transformed my application process. The AI counsellor felt like having a real expert available 24/7.&rdquo;
                            </p>
                            <footer className="text-sm font-medium text-white/80">
                                Sofia Davis, accepted to Stanford University
                            </footer>
                        </blockquote>
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex items-center justify-center p-8 bg-background relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10"></div>
                <Suspense fallback={<div className="flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>}>
                    <AuthContent />
                </Suspense>
            </div>
        </div>
    );
}

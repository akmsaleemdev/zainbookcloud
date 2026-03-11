import { useState } from "react";
import { Link } from "react-router-dom";
import { Building2, UploadCloud, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function Register() {
    const [step, setStep] = useState(1);

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
            {/* Background Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-[1000px] grid grid-cols-1 lg:grid-cols-2 gap-8 z-10">
                {/* Left Side: Registration Form */}
                <Card className="glass-card border-border/50 shadow-2xl relative overflow-hidden">
                    {/* Progress Bar */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-secondary">
                        <div
                            className="h-full bg-primary transition-all duration-500 ease-in-out"
                            style={{ width: `${(step / 3) * 100}%` }}
                        />
                    </div>

                    <CardContent className="p-8 md:p-12 space-y-8 mt-4">
                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold tracking-tight text-foreground">Create your account</h1>
                            <p className="text-muted-foreground text-sm">Join ZainBook AI to manage your properties effortlessly</p>
                        </div>

                        {step === 1 && (
                            <div className="space-y-5 animate-fade-in">
                                <div className="space-y-2">
                                    <Label htmlFor="companyName" className="text-foreground/80">Company Name</Label>
                                    <Input id="companyName" placeholder="e.g. Acme Properties LLC" className="bg-secondary/50 h-12" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName" className="text-foreground/80">First Name</Label>
                                        <Input id="firstName" placeholder="John" className="bg-secondary/50 h-12" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastName" className="text-foreground/80">Last Name</Label>
                                        <Input id="lastName" placeholder="Doe" className="bg-secondary/50 h-12" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-foreground/80">Work Email</Label>
                                    <Input id="email" type="email" placeholder="john@acme.com" className="bg-secondary/50 h-12" />
                                </div>

                                <Button className="w-full h-12 btn-premium rounded-xl" onClick={() => setStep(2)}>
                                    Continue
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-5 animate-fade-in">
                                <div className="space-y-2">
                                    <Label htmlFor="tradeLicense" className="text-foreground/80">Trade License Number (UAE)</Label>
                                    <Input id="tradeLicense" placeholder="TRN-XXXXXX" className="bg-secondary/50 h-12" />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-foreground/80">Upload Trade License</Label>
                                    <div className="border-2 border-dashed border-border/50 rounded-2xl p-8 hover:bg-secondary/20 hover:border-primary/50 transition-colors cursor-pointer text-center group">
                                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                                            <UploadCloud className="w-6 h-6 text-primary" />
                                        </div>
                                        <p className="text-sm font-medium text-foreground mb-1">Click to upload or drag and drop</p>
                                        <p className="text-xs text-muted-foreground">PDF, JPG or PNG (max. 10MB)</p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <Button variant="outline" className="h-12 w-12 shrink-0 rounded-xl bg-secondary/50 border-border/50" onClick={() => setStep(1)}>
                                        <ArrowRight className="w-4 h-4 rotate-180" />
                                    </Button>
                                    <Button className="w-full h-12 btn-premium rounded-xl flex-1" onClick={() => setStep(3)}>
                                        Verify Details
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-6 animate-fade-in text-center py-8">
                                <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle2 className="w-10 h-10 text-success" />
                                </div>
                                <h2 className="text-2xl font-bold text-foreground">You're almost there!</h2>
                                <p className="text-muted-foreground leading-relaxed max-w-sm mx-auto">
                                    We've sent a verification link to your email. Please click the link to activate your account and set your password.
                                </p>
                                <div className="pt-6">
                                    <Button variant="outline" className="w-full h-12 bg-secondary/50 border-border/50 rounded-xl">
                                        Back to Sign In
                                    </Button>
                                </div>
                            </div>
                        )}

                        <p className="text-center text-sm text-muted-foreground pt-4">
                            Already have an account?{" "}
                            <Link to="/auth" className="text-primary font-semibold hover:underline decoration-primary/30 underline-offset-4">
                                Sign in
                            </Link>
                        </p>
                    </CardContent>
                </Card>

                {/* Right Side: Value Proposition (Hidden on small screens) */}
                <div className="hidden lg:flex flex-col justify-center p-12 relative">
                    <div className="w-16 h-16 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm flex items-center justify-center mb-8">
                        <Building2 className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-4xl font-bold text-white mb-6 leading-tight">
                        The all-in-one platform for property management
                    </h2>
                    <ul className="space-y-5">
                        {[
                            "Automate Ejari and contract renewals",
                            "Integrated VAT-compliant accounting",
                            "Manage HR and WPS payroll natively",
                            "AI-powered predictive maintenance"
                        ].map((feature, i) => (
                            <li key={i} className="flex items-center gap-3 text-white/80">
                                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                    <CheckCircle2 className="w-4 h-4 text-primary" />
                                </div>
                                <span className="text-[15px]">{feature}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}

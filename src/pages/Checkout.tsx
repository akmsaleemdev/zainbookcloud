import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2, ArrowLeft, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Checkout() {
    const [status, setStatus] = useState<'processing' | 'success' | 'failed'>('processing');

    // Simulate payment processing
    useEffect(() => {
        const timer = setTimeout(() => {
            setStatus('success');
        }, 2500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background relative">
            <div className="w-full max-w-md z-10 animate-fade-in y-6">

                <div className="mb-8 text-center">
                    <h1 className="text-xl font-bold flex justify-center items-center gap-2">
                        ZainBook <span className="font-light text-muted-foreground">Secure Checkout</span>
                    </h1>
                </div>

                <Card className="glass-card shadow-2xl border-border/50 relative overflow-hidden">
                    <CardContent className="p-8 sm:p-10 space-y-8 text-center pt-12 text-foreground">

                        {status === 'processing' && (
                            <div className="space-y-6 flex flex-col items-center animate-fade-in">
                                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center relative">
                                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold mb-2">Processing Payment</h2>
                                    <p className="text-muted-foreground">Please do not close or refresh this window.</p>
                                </div>
                            </div>
                        )}

                        {status === 'success' && (
                            <div className="space-y-6 flex flex-col items-center animate-fade-in">
                                <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center">
                                    <CheckCircle2 className="w-10 h-10 text-success" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
                                    <p className="text-muted-foreground leading-relaxed">
                                        Thank you. Your payment of <strong>AED 4,500.00</strong> has been processed successfully. A receipt has been sent to your email.
                                    </p>
                                </div>
                                <div className="w-full pt-4 space-y-3">
                                    <Button className="w-full h-12 btn-premium rounded-xl">
                                        Return to Dashboard
                                    </Button>
                                    <Button variant="outline" className="w-full h-12 rounded-xl bg-secondary/50 border-border/50">
                                        <Receipt className="w-4 h-4 mr-2" />
                                        Download Receipt
                                    </Button>
                                </div>
                            </div>
                        )}

                        {status === 'failed' && (
                            <div className="space-y-6 flex flex-col items-center animate-fade-in">
                                <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center">
                                    <XCircle className="w-10 h-10 text-destructive" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold mb-2">Payment Failed</h2>
                                    <p className="text-muted-foreground leading-relaxed">
                                        We were unable to process your transaction. Please check your payment details or contact your bank.
                                    </p>
                                </div>
                                <div className="w-full pt-4 space-y-3">
                                    <Button className="w-full h-12 btn-premium rounded-xl">
                                        Try Again
                                    </Button>
                                    <Button variant="ghost" className="w-full text-muted-foreground hover:text-foreground">
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        )}

                    </CardContent>

                    {/* Card Decoration */}
                    {status === 'success' && (
                        <div className="absolute top-0 left-0 w-full h-1 bg-success animate-fade-in" />
                    )}
                    {status === 'failed' && (
                        <div className="absolute top-0 left-0 w-full h-1 bg-destructive animate-fade-in" />
                    )}
                    {status === 'processing' && (
                        <div className="absolute top-0 left-0 w-full h-1 bg-primary/30 overflow-hidden">
                            <div className="h-full bg-primary w-1/3 animate-pulse" />
                        </div>
                    )}
                </Card>

                <div className="mt-8 text-center text-sm text-muted-foreground">
                    <p>Secured by 256-bit encryption</p>
                </div>

            </div>
        </div>
    );
}

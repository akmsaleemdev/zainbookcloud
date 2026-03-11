import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const FAQS = [
    {
        question: "How do I pay my rent online?",
        answer: "You can securely pay your rent online via the Customer Dashboard. We accept credit cards, debit cards, and bank transfers. Navigate to the Payments section, select the due invoice, and follow the instructions to complete your payment.",
    },
    {
        question: "What is the process for renewing my lease?",
        answer: "Our system will notify you 90 days prior to your lease expiration. You can review the renewal terms directly in your dashboard. Once agreed, digital signatures can be applied, and the updated Ejari will be processed automatically.",
    },
    {
        question: "How do I submit a maintenance request?",
        answer: "Log into your Customer Dashboard and click on 'New Request' under the Recent Requests section. Provide a brief description and optionally upload photos of the issue. Our operations team will assign a technician promptly.",
    },
    {
        question: "Can I upgrade my unit or transfer my lease?",
        answer: "Yes, lease transfers and unit upgrades are possible depending on availability within our properties. Please contact your dedicated property manager or submit a request via the portal to discuss options.",
    },
];

export default function FAQ() {
    return (
        <div className="space-y-8 animate-fade-in pb-24 max-w-4xl mx-auto mt-12 px-4">
            <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <HelpCircle className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    Frequently Asked Questions
                </h1>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                    Find answers to common questions about managing your tenancy, payments, and using the ZainBook platform.
                </p>
            </div>

            <div className="relative max-w-xl mx-auto mb-12">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                    placeholder="Search for articles or topics..."
                    className="pl-12 h-14 text-base bg-secondary/40 border-border/50 rounded-2xl focus:border-primary/50"
                />
            </div>

            <div className="glass-card rounded-2xl p-6 md:p-8 shadow-xl shadow-black/5 border border-border/50">
                <Accordion type="single" collapsible className="w-full">
                    {FAQS.map((faq, i) => (
                        <AccordionItem key={i} value={`item-${i}`} className="border-b border-border/50 last:border-0">
                            <AccordionTrigger className="text-left font-semibold text-base py-4 hover:no-underline hover:text-primary transition-colors">
                                {faq.question}
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground leading-relaxed pb-4">
                                {faq.answer}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>

            <div className="text-center mt-12">
                <p className="text-muted-foreground mb-4">Still have questions?</p>
                <Button className="btn-premium rounded-xl px-8 h-12">
                    Contact Support
                </Button>
            </div>
        </div>
    );
}

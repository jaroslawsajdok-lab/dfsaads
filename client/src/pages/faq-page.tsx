import { useQuery } from "@tanstack/react-query";
import { SubpageLayout } from "@/components/subpage-layout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type FaqItem = {
  id: number;
  question: string;
  answer: string;
  sort_order: number;
};

async function apiFetch<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export default function FaqPage() {
  const { data: faqItems = [], isLoading } = useQuery<FaqItem[]>({
    queryKey: ["faq"],
    queryFn: () => apiFetch("/api/faq"),
  });

  return (
    <SubpageLayout title="Najczęściej zadawane pytania" titleKey="subpage_faq_title">
      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground" data-testid="faq-loading">
          Ładowanie pytań…
        </div>
      ) : faqItems.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground" data-testid="faq-empty">
          Brak pytań i odpowiedzi.
        </div>
      ) : (
        <Accordion type="single" collapsible className="w-full" data-testid="faq-accordion">
          {faqItems.map((item) => (
            <AccordionItem
              key={item.id}
              value={`faq-${item.id}`}
              data-testid={`faq-item-${item.id}`}
            >
              <AccordionTrigger
                className="text-left font-display text-lg"
                data-testid={`faq-trigger-${item.id}`}
              >
                {item.question}
              </AccordionTrigger>
              <AccordionContent data-testid={`faq-content-${item.id}`}>
                <p className="leading-relaxed text-foreground/80">{item.answer}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </SubpageLayout>
  );
}

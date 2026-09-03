import { Card } from "@/components/ui/card/Card";
import { PaymentByFormCard } from "./components/payment-form/PaymentByFormCard";

export function PaymentByFormView() {
  return (
    <Card className="mx-auto w-full max-w-[600px] px-[30px] py-[30px]">
      <PaymentByFormCard />
    </Card>
  );
}

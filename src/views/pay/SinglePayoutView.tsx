import { Card } from "@stableflow/pay-ui/card";
import { SinglePayoutCard } from "./components/single-payout/SinglePayoutCard";

export function SinglePayoutView() {
  return (
    <Card className="mx-auto w-full max-w-[600px] px-[30px] py-[30px]">
      <SinglePayoutCard />
    </Card>
  );
}

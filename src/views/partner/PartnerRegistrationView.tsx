import { type FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button/Button";
import { BUTTON_SIZE } from "@/components/ui/button/config";
import { useCreatePartnerMutation, usePartnerQuery } from "@/hooks/use-partner-api";
import useToast from "@/hooks/use-toast";
import { PartnerField } from "./components/PartnerField";
import {
  ADDITIONAL_DETAILS_MAX_LENGTH,
  COMPANY_MAX_LENGTH,
  FIRST_NAME_MAX_LENGTH,
  LAST_NAME_MAX_LENGTH,
  PURPOSE_MAX_LENGTH,
  TELEGRAM_MAX_LENGTH,
  WEBSITE_MAX_LENGTH,
} from "./config";
import { partnerApiError, partnerRegistrationError } from "./utils";

export function PartnerRegistrationView() {
  const partnerQuery = usePartnerQuery();
  const createMutation = useCreatePartnerMutation();
  const navigate = useNavigate();
  const toast = useToast();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [company, setCompany] = useState("");
  const [purpose, setPurpose] = useState("");
  const [website, setWebsite] = useState("");
  const [telegram, setTelegram] = useState("");
  const [additionalDetails, setAdditionalDetails] = useState("");

  if (partnerQuery.isPending) {
    return <p className="font-montserrat text-sm text-[#909090]">Loading…</p>;
  }

  if (partnerQuery.isError) {
    return (
      <p className="font-montserrat text-sm text-danger">
        {partnerApiError(partnerQuery.error, "Failed to load partner")}
      </p>
    );
  }

  if (partnerQuery.data?.id) {
    return <Navigate to="/partner/api-keys" replace />;
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const ruleError = partnerRegistrationError({
      firstName,
      lastName,
      company,
      purpose,
      website,
      telegram,
      additionalDetails,
    });
    if (ruleError) {
      toast.fail({ title: ruleError });
      return;
    }
    try {
      await createMutation.mutateAsync({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        company: company.trim(),
        purpose: purpose.trim(),
        website: website.trim(),
        telegram: telegram.trim(),
        description: additionalDetails.trim(),
      });
      navigate("/partner/api-keys", { replace: true });
    } catch (error) {
      toast.fail({ title: partnerApiError(error, "Could not send request") });
    }
  };

  return (
    <div>
      <h1 className="font-montserrat text-[26px] font-semibold text-black">Partner Registration</h1>
      <form
        onSubmit={submit}
        className="mx-auto mt-8 flex w-full max-w-[446px] flex-col gap-6 lg:mt-12"
      >
        <PartnerField
          id="first-name"
          label="First Name"
          value={firstName}
          onChange={setFirstName}
          maxLength={FIRST_NAME_MAX_LENGTH}
          autoComplete="given-name"
        />
        <PartnerField
          id="last-name"
          label="Last Name"
          value={lastName}
          onChange={setLastName}
          maxLength={LAST_NAME_MAX_LENGTH}
          autoComplete="family-name"
        />
        <PartnerField
          id="company"
          label="Company / Business Name"
          value={company}
          onChange={setCompany}
          placeholder="e.g., Eureka Labs"
          maxLength={COMPANY_MAX_LENGTH}
          autoComplete="organization"
        />
        <PartnerField
          id="purpose"
          label="What is your main purpose for registering?"
          value={purpose}
          onChange={setPurpose}
          placeholder="Please share how you plan to use our API and what you aim to achieve..."
          maxLength={PURPOSE_MAX_LENGTH}
          multiline
        />
        <PartnerField
          id="website"
          label="Website / URL"
          value={website}
          onChange={setWebsite}
          placeholder="e.g., https://your-company.com"
          maxLength={WEBSITE_MAX_LENGTH}
          optional
          autoComplete="url"
        />
        <PartnerField
          id="telegram"
          label="Telegram Handle"
          value={telegram}
          onChange={setTelegram}
          placeholder="e.g., @username"
          maxLength={TELEGRAM_MAX_LENGTH}
          optional
        />
        <PartnerField
          id="additional-details"
          label="Additional Details"
          value={additionalDetails}
          onChange={setAdditionalDetails}
          placeholder="Share details about your project, use case, or other information that can help us support you better..."
          maxLength={ADDITIONAL_DETAILS_MAX_LENGTH}
          optional
          multiline
        />
        <Button type="submit" size={BUTTON_SIZE.Lg} className="w-full" loading={createMutation.isPending}>
          Send Request
        </Button>
      </form>
    </div>
  );
}

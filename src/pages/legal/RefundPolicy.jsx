import { Link } from "react-router-dom";
import { usePageTitle } from "../../hooks/usePageTitle";
import LegalPageLayout from "../../components/legal/LegalPageLayout";

export default function RefundPolicy() {
  usePageTitle("Refund Policy");

  return (
    <LegalPageLayout
      title="Glass Finance — Refund Policy"
      effectiveDate="1st of August, 2026"
      lastUpdated="1st of August, 2026"
    >
      <p>
        This Refund Policy explains when and how refunds are available for payments made
        through Glass. It supplements our <Link to="/terms">Terms of Service</Link> and
        should be read alongside it. Capitalized terms not defined here have the meaning given
        in the Terms of Service.
      </p>
      <p>
        <strong>Note:</strong> Glass processes two distinct categories of payment: (1){" "}
        <strong>Platform Fees</strong> that Glass charges Communities for use of the Platform,
        and (2) <strong>Dues and Contributions</strong> that flow from Members to Communities,
        which Glass merely facilitates. These are refunded differently, as set out below.
      </p>

      <h2>1. Overview</h2>
      <p>
        Glass is a technology platform that facilitates payment collection between Communities
        and Members. In most cases, Dues and Contributions are governed by the Community's own
        refund rules, since Glass is not a party to the underlying obligation between a
        Community and its Members (see Section 6 of the Terms of Service). This Policy explains
        which refunds Glass can process directly, and which must be requested from the
        Community.
      </p>

      <h2>2. Platform Fees</h2>
      <p>
        2.1 Fees paid by a Community directly to Glass for use of the Platform (e.g.,
        subscription fees, where applicable) may be refunded at Glass's discretion where the
        Community experienced a verified service failure directly attributable to Glass, or as
        otherwise required by Applicable Law.
      </p>
      <p>
        2.2 Platform fees are generally non-refundable once the corresponding billing period or
        service has been rendered, except as described in Section 12 (Service Interruptions).
      </p>

      <h2>3. Payment Processor Fees</h2>
      <p>
        3.1 Where a transaction includes a fee component charged by our Payment Processor
        (currently Paystack) or embedded in Glass's top-up fee model, that processing fee is
        generally non-refundable once the transaction has been successfully processed, because
        the underlying processing cost has already been incurred with the Payment Processor.
      </p>
      <p>
        3.2 Where a transaction is reversed in full (e.g., due to a confirmed duplicate or
        unauthorized payment under Sections 6–8), Glass will make reasonable efforts to recover
        and refund the associated processing fee where the Payment Processor's own rules permit
        this.
      </p>

      <h2>4. Community Dues and Contributions</h2>
      <p>
        4.1 Refunds of Dues and Contributions collected by a Community from its Members are,
        as a general rule, governed by that Community's own refund policy, which each Community
        is responsible for setting and communicating to its Members under Section 6 of the
        Terms of Service.
      </p>
      <p>
        4.2 Glass will provide Community Administrators with the tools necessary to process
        refunds to Members through the Platform, where technically supported by the Payment
        Processor, but Glass does not independently decide whether a Member is entitled to a
        refund of Dues — that determination belongs to the Community.
      </p>
      <p>
        4.3 Where a Community refuses to refund Dues that a Member believes are owed, the
        Member's recourse is against the Community directly; Glass's role is limited to
        facilitating any refund the Community elects to process, and to assisting with the
        categories of Glass-initiated refunds described in Sections 6–9.
      </p>

      <h2>5. Organization-Initiated Refunds</h2>
      <p>
        An Organization or Community Administrator may initiate a refund to a Member directly
        through the Platform, subject to the Payment Processor's applicable refund window
        (currently up to the timeframe specified in Paystack's own merchant terms) and the
        availability of funds in the Community's settlement balance.
      </p>

      <h2>6. Duplicate Payments</h2>
      <p>
        Where a Member is charged more than once for the same Dues or Contribution due to a
        technical error (e.g., a double-submission or processing glitch), Glass will
        investigate upon request and, where a duplicate charge is confirmed, will facilitate a
        refund of the duplicate amount to the original payment method.
      </p>

      <h2>7. Accidental Payments</h2>
      <p>
        Where a Member can demonstrate that a payment was made in clear error (e.g., wrong
        Community, wrong amount entered due to a Platform display error), Glass will
        investigate and may facilitate a refund at its discretion, in coordination with the
        receiving Community where the funds have already settled.
      </p>

      <h2>8. Unauthorized Transactions</h2>
      <p>
        Where a User reports that a transaction was made without their authorization (e.g.,
        unauthorized use of their payment method or Account), Glass will investigate promptly,
        may place a temporary hold on the disputed funds pending investigation, and will
        facilitate a refund where the claim is substantiated, consistent with the Payment
        Processor's dispute rules and Applicable Law.
      </p>

      <h2>9. Failed Transactions</h2>
      <p>
        Where a transaction fails to complete (e.g., payment is debited but not confirmed by
        the Payment Processor due to a technical error), any amount debited that did not result
        in a completed transaction will be automatically reversed by the Payment Processor in
        accordance with its standard timelines, typically within the timeframe disclosed by
        Paystack for failed transaction reversals. If reversal does not occur automatically,
        contact us using Section 17.
      </p>

      <h2>10. Chargebacks</h2>
      <p>
        Where a Member disputes a transaction directly with their card issuer or bank rather
        than through Glass (a chargeback), the matter is handled under the Payment Processor's
        chargeback process described in Section 12 of the Terms of Service, and this Refund
        Policy's timelines do not apply; the card network's or bank's own chargeback timelines
        will govern instead.
      </p>

      <h2>11. Subscription Refunds</h2>
      <p>
        Where Glass offers subscription-based Platform plans to Communities, subscription fees
        already billed are generally non-refundable for the current billing period, except: (a)
        where required by Applicable Law (e.g., a statutory cooling-off period, if applicable);
        (b) where Glass discontinues a paid feature the Community specifically subscribed for,
        without a reasonably equivalent replacement; or (c) as described in Section 12.
      </p>

      <h2>12. Service Interruptions</h2>
      <p>
        Where a prolonged, verified Glass-caused Platform outage materially prevents a
        Community from using paid features for a significant portion of a billing period, Glass
        may, at its discretion, issue a pro-rated credit or refund for the affected period. This
        does not apply to outages caused by third-party providers (including Payment
        Processors, cloud providers, or KYC Providers) or by Force Majeure events under Section
        28 of the Terms of Service.
      </p>

      <h2>13. Refund Timelines</h2>
      <p>
        Once a refund is approved, funds are typically returned to the original payment method
        within the timeframe disclosed by our Payment Processor for the relevant payment method
        (commonly 3–10 business days for card payments and up to 24–48 hours for bank
        transfers), though actual timing may vary depending on the Member's bank or card
        issuer, which is outside Glass's control.
      </p>

      <h2>14. Refund Methods</h2>
      <p>
        Refunds are issued to the original payment method used for the transaction wherever
        technically possible. Where the original payment method is no longer valid or
        available, Glass or the Community may, at their discretion and where supported by the
        Payment Processor, arrange an alternative refund method (e.g., bank transfer), subject
        to additional verification.
      </p>

      <h2>15. Required Documentation</h2>
      <p>
        To process a refund request, we may require: the transaction reference or receipt, a
        description of the reason for the refund, confirmation of the payment method used, and,
        for unauthorized transaction claims, any supporting evidence of unauthorized use (such
        as a police report, where applicable, for high-value disputes).
      </p>

      <h2>16. When Refunds Are Not Available</h2>
      <p>
        Refunds are generally not available where: the Dues or Contribution was correctly
        charged in accordance with the Member's authorization and the Community's own (lawful)
        refund policy; the request is made after the Payment Processor's applicable refund
        window has closed; the funds have already been withdrawn or spent by the Community and
        the Community declines to authorize a refund (in which case the Member's recourse is
        against the Community); the transaction is under active fraud or AML investigation; or
        the request is based solely on dissatisfaction with a Community's internal decisions
        (e.g., how legitimately collected Dues were used), which falls outside Glass's role as
        a technology provider.
      </p>

      <h2>17. How to Request a Refund</h2>
      <p>
        To request a refund, contact us at{" "}
        <a href="mailto:support@glasspay.app">support@glasspay.app</a> with your transaction
        reference, or use the "Request Refund" option within the Platform where available. We
        aim to acknowledge refund requests within two (2) business days and to provide a
        substantive response, including next steps or a decision, within ten (10) business
        days, though complex investigations (e.g., unauthorized transaction claims) may take
        longer.
      </p>
    </LegalPageLayout>
  );
}

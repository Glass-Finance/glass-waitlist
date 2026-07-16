import { Link } from "react-router-dom";
import { usePageTitle } from "../../hooks/usePageTitle";
import LegalPageLayout from "../../components/legal/LegalPageLayout";

export default function AcceptableUsePolicy() {
  usePageTitle("Acceptable Use Policy");

  return (
    <LegalPageLayout
      title="Glass Finance — Acceptable Use Policy"
      effectiveDate="1st of August, 2026"
      lastUpdated="1st of August, 2026"
    >
      <p>
        This Acceptable Use Policy ("AUP") governs how Communities, Community Owners,
        Community Administrators, Members, Guests, and Organizations (collectively, "Users")
        may use the Glass website, mobile applications, dashboards, and APIs (the "Platform").
        This AUP is incorporated by reference into our <Link to="/terms">Terms of Service</Link>.
        Capitalized terms not defined here have the meaning given in the Terms of Service.
      </p>
      <p>
        Violation of this AUP may result in content removal, restricted functionality,
        transaction holds, Account suspension, or termination, as described in Section 21
        (Account Suspension) and Section 22 (Termination) of the Terms of Service.
      </p>

      <h2>1. Purpose</h2>
      <p>
        Glass exists to help legitimate communities and organizations manage collections
        transparently and efficiently. This AUP sets out the activities that are prohibited on
        the Platform to protect Users, comply with Applicable Law, and preserve trust in the
        Glass ecosystem.
      </p>

      <h2>2. Financial Crime</h2>
      <p>
        Users must not use the Platform for money laundering, terrorist financing,
        proliferation financing, or any other financial crime. This includes structuring
        transactions to avoid reporting thresholds, using Glass to move funds on behalf of
        undisclosed third parties, or disguising the true origin, ownership, or purpose of
        funds.
      </p>

      <h2>3. Fraud and Deception</h2>
      <p>
        Users must not use the Platform to defraud any person, including by misrepresenting
        the purpose of a payment request, collecting Dues under false pretenses,
        misappropriating collected funds contrary to a Community's stated purpose, or engaging
        in identity theft.
      </p>

      <h2>4. Fake or Misrepresented Communities</h2>
      <p>
        Users must not create Communities that misrepresent their affiliation, purpose,
        membership, or legitimacy, including impersonating an existing organization,
        fabricating a membership base, or creating a Community solely to collect payments with
        no genuine underlying group or purpose.
      </p>

      <h2>5. Spam and Unsolicited Communication</h2>
      <p>
        Users must not use the Platform's notification, email, or SMS tools to send unsolicited
        bulk communications unrelated to legitimate Community administration, or to contact
        individuals who have not consented to receive communications from that Community.
      </p>

      <h2>6. Harassment and Abuse</h2>
      <p>
        Users must not use the Platform to harass, threaten, intimidate, or abuse other Users,
        including through abusive language in Community messaging, payment descriptions,
        support communications, or elsewhere on the Platform.
      </p>

      <h2>7. Malware and Technical Abuse</h2>
      <p>
        Users must not upload, transmit, or introduce viruses, malware, ransomware, or other
        harmful code to the Platform, and must not attempt to reverse-engineer, decompile, or
        disassemble Platform software except to the extent expressly permitted by Applicable
        Law.
      </p>

      <h2>8. Unauthorized API and Automation Use</h2>
      <p>
        Users must not access Glass's APIs or automate interactions with the Platform except
        through officially supported and authorized means, and must not exceed the scope of any
        API access granted to them.
      </p>

      <h2>9. Data Scraping</h2>
      <p>
        Users must not scrape, harvest, or extract data from the Platform using automated
        tools, bots, or scripts, except where expressly authorized in writing by Glass or
        through officially supported export features.
      </p>

      <h2>10. Intellectual Property Infringement</h2>
      <p>
        Users must not upload or use content on the Platform (including Community names,
        logos, or descriptions) that infringes the intellectual property rights of any third
        party.
      </p>

      <h2>11. Illegal Fundraising</h2>
      <p>
        Users must not use the Platform to conduct fundraising activities that are unlawful
        under Applicable Law, including unregistered public solicitation of donations where
        registration is legally required, or fundraising for a purpose prohibited by Nigerian
        law.
      </p>

      <h2>12. Unauthorized Gambling</h2>
      <p>
        Users must not use the Platform to operate or facilitate gambling, betting, lotteries,
        or games of chance involving monetary stakes, except where the operator holds all
        licenses required under Applicable Law and such use has been expressly approved in
        writing by Glass in advance.
      </p>

      <h2>13. Ponzi and Pyramid Schemes</h2>
      <p>
        Users must not use the Platform to operate or participate in Ponzi schemes, pyramid
        schemes, multi-level marketing schemes that primarily reward recruitment rather than
        genuine sale of goods or services, or any scheme that promises returns funded primarily
        by new participants' contributions rather than legitimate underlying activity.
      </p>

      <h2>14. Fake Charities</h2>
      <p>
        Users must not solicit donations for a charitable or humanitarian cause that does not
        genuinely exist, or misrepresent how donated funds collected through the Platform will
        be used.
      </p>

      <h2>15. Sanctions Violations</h2>
      <p>
        Users must not use the Platform if they are subject to sanctions administered by the
        Nigerian government, the United Nations, the U.S. Office of Foreign Assets Control
        (OFAC), the United Kingdom, or the European Union, and must not use the Platform to
        transact with any sanctioned individual, entity, or jurisdiction.
      </p>

      <h2>16. Child Exploitation</h2>
      <p>
        Users must not use the Platform to facilitate, promote, distribute, or collect funds
        connected to child sexual abuse material, child exploitation, or any form of harm to
        minors. Glass will report any suspected violation of this Section to the National
        Agency for the Prohibition of Trafficking in Persons (NAPTIP), the Nigeria Police
        Force, and/or other competent authorities, and will terminate the associated Account
        immediately and without prior notice.
      </p>

      <h2>17. Illegal Content</h2>
      <p>
        Users must not upload, share, or link to content that is illegal under Applicable Law,
        including content that incites violence, promotes terrorism, or violates Nigerian
        criminal law.
      </p>

      <h2>18. Credential Sharing and Impersonation</h2>
      <p>
        Users must not share Account login credentials with unauthorized persons, or
        impersonate another individual, Community, or Organization when creating or operating
        an Account.
      </p>

      <h2>19. Security Circumvention</h2>
      <p>
        Users must not attempt to bypass, disable, or circumvent any security, identity
        verification, fraud prevention, or access control measure implemented on the Platform.
      </p>

      <h2>20. Platform and Rate Limit Abuse</h2>
      <p>
        Users must not interfere with the normal operation of the Platform, attempt to
        overwhelm Platform infrastructure, circumvent rate limits imposed on API or feature
        use, or interfere with other Users' ability to use the Platform.
      </p>

      <h2>21. Reporting Violations</h2>
      <p>
        If you become aware of conduct that may violate this AUP, please report it to{" "}
        <a href="mailto:legal@glasspay.app">legal@glasspay.app</a> with as much detail as
        possible, including the Community or Account involved and a description of the
        suspected violation. We will investigate reports in good faith and take appropriate
        action, though we may not be able to share the outcome of an investigation due to
        confidentiality and legal constraints.
      </p>

      <h2>22. Consequences of Violations</h2>
      <p>
        Violations of this AUP may result in one or more of the following, at Glass's
        discretion and proportionate to the severity of the violation:
      </p>
      <ul>
        <li>removal of the offending content;</li>
        <li>warning to the responsible User;</li>
        <li>restriction of specific Platform features;</li>
        <li>holding or reversing implicated transactions;</li>
        <li>suspension of the Account under Section 21 of the Terms of Service;</li>
        <li>termination of the Account under Section 22 of the Terms of Service;</li>
        <li>reporting to relevant regulators or law enforcement, including the Central Bank of Nigeria, the Nigeria Financial Intelligence Unit, NAPTIP, or the Nigeria Police Force, where required or appropriate;</li>
        <li>pursuit of civil or criminal remedies available under Applicable Law.</li>
      </ul>
      <p>
        Repeated or severe violations, or violations involving financial crime, fraud, or harm
        to minors, will generally result in immediate Account termination without opportunity
        for remediation.
      </p>
    </LegalPageLayout>
  );
}

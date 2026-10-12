# Optional module: Committee Protocol Review

**Story:** "We review protocols at convened committee meetings."
**Requires:** core >=2.3.0, modules: compliance_protocols, governance
**Records targets declared:** none
**AllowedValues groups declared:** none

This module is governed by the module taxonomy's two laws (capability criterion, encapsulation rule); see the Architecture section of the core specification. Canonical machine-readable definition: `optional_modules.committee_protocol_review` in `udm_schema_v2.json`. Module tables carry the universal audit columns; they are omitted below as in the core spec.

The bridge between Governance and Compliance Protocols: which Protocols were reviewed at which Meetings, with agenda position, vote tallies, and decisions, plus member recusals. Vote tallies live per review row because one meeting reviews many protocols. Recusal rows feed the application's effective-quorum computation for a specific protocol's review.

## Table reference

#### MeetingProtocolReview

A Protocol reviewed at a Meeting, with agenda position, vote tally, and committee decision. Unique per (Meeting_ID, Protocol_ID).

| Column | Type | Required | Notes |
|---|---|---|---|
| MeetingProtocolReview_ID | ID | required | PK |
| Meeting_ID | ID | required | → Meeting. The meeting |
| Protocol_ID | ID | required | → Protocol. The parent protocol |
| Agenda_Sort_Order | Count | required | Position on the meeting agenda |
| Review_Decision | Status | required | Constrained: Approved / Approved_With_Modifications / Tabled / Returned / Disapproved / Deferred |
| Decision_Date | Date | required | Typically the meeting date; later for tabled-and-resumed reviews |
| Decision_Notes | LongText | optional | Committee rationale, required modifications |
| Vote_For_Count | Count | optional | Members voting in favor |
| Vote_Against_Count | Count | optional | Members voting against |
| Vote_Abstain_Count | Count | optional | Members abstaining |

#### MemberRecusal

A CommitteeMember recused from review of a specific Protocol, permanently or for one meeting.

| Column | Type | Required | Notes |
|---|---|---|---|
| MemberRecusal_ID | ID | required | PK |
| CommitteeMember_ID | ID | required | → CommitteeMember. The committee member |
| Protocol_ID | ID | required | → Protocol. The parent protocol |
| Recusal_Reason | LongText | required | Why the member is recused |
| Recused_Date | Date | required | When the recusal was declared |
| Is_Permanent | Boolean | required | True: recused from every meeting reviewing this Protocol; false: recused for one meeting only |
| Meeting_ID | ID | optional | → Meeting. Required when Is_Permanent = false; null when true |

## Cross-row constraints

- **MeetingProtocolReview**: A Protocol appears at most once on a given Meeting's review agenda: (Meeting_ID, Protocol_ID) is unique.
- **MemberRecusal**: Meeting_ID is required when Is_Permanent = false and must be null when Is_Permanent = true.

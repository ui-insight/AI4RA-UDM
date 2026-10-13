# Optional module: Governance

**Story:** "Our committees convene, vote, and keep minutes."
**Requires:** core >=2.3.0, no module dependencies
**Records targets declared:** Committee, CommitteeMember, Meeting
**AllowedValues groups declared:** CommitteeMemberRole

This module is governed by the module taxonomy's two laws (capability criterion, encapsulation rule); see the Architecture section of the core specification. Canonical machine-readable definition: `optional_modules.governance` in `udm_schema_v2.json`. Module tables carry the universal audit columns; they are omitted below as in the core spec.

Convened-body infrastructure reused by any capability that needs committees: compliance review, COI deliberation, internal-award review panels. Regime-specific member classifications (PHS Policy IV.A.3 scientist / nonscientist / unaffiliated designations, IRB community-member status) attach as core Classification rows rather than columns, keeping CommitteeMember generic. Quorum data lives here; quorum logic is application code.

## Table reference

#### Committee

A convened body: an IACUC, an IRB, an IBC, a COI committee, a research-security review board, an internal-award review panel.

| Column | Type | Required | Notes |
|---|---|---|---|
| Committee_ID | ID | required | PK |
| Committee_Name | MediumName | required | Human-readable name |
| Organization_ID | ID | required | → Organization. The institution or unit that convenes this committee |
| Committee_Type | Status | required | Constrained: IACUC / IRB / IBC / COI / Research_Security / Internal_Award_Review / Policy_Board / Other |
| Charter_Description | LongText | optional | The committee's mandate |
| Established_Date | Date | optional | When the committee was established |
| Committee_Status | Status | required | Constrained: Active / Suspended / Disbanded |

#### CommitteeMember

A person serving on a Committee with a role and appointment term.

| Column | Type | Required | Notes |
|---|---|---|---|
| CommitteeMember_ID | ID | required | PK |
| Committee_ID | ID | required | → Committee. The committee |
| Personnel_ID | ID | required | → Personnel. The person |
| Role_Value_ID | ID | required | → AllowedValues. AllowedValues Value_Group = 'CommitteeMemberRole'. Recommended values: Chair / Vice_Chair / Member / Ex_Officio_Member / Observer |
| Appointment_Term_Start | Date | required | Start of the member's appointment term |
| Appointment_Term_End | Date | optional | Null for indefinite appointments |
| Member_Status | Status | required | Constrained: Active / On_Leave / Terminated |

#### Meeting

A convened meeting of a Committee with quorum tracking and minutes.

| Column | Type | Required | Notes |
|---|---|---|---|
| Meeting_ID | ID | required | PK |
| Committee_ID | ID | required | → Committee. The committee |
| Meeting_Date | Date | required | Scheduled date |
| Meeting_Type | Status | required | Constrained: Regular / Special / Emergency / Subcommittee |
| Meeting_Status | Status | required | Constrained: Scheduled / Convened / Cancelled / Adjourned |
| Quorum_Required | Count | required | Members required for a quorum |
| Quorum_Met | Boolean | optional | Required when Meeting_Status reaches 'Convened' or later |
| Location_Description | MediumName | optional | Physical, video, or hybrid |
| Convened_Time | Timestamp | optional | When the meeting actually started |
| Adjourned_Time | Timestamp | optional | When the meeting ended |
| Minutes_Document_ID | ID | optional | → Document. Approved meeting minutes when available |

#### MeetingAttendance

Per-member attendance for a Meeting, with arrival and departure for quorum verification. Unique per (Meeting_ID, CommitteeMember_ID).

| Column | Type | Required | Notes |
|---|---|---|---|
| MeetingAttendance_ID | ID | required | PK |
| Meeting_ID | ID | required | → Meeting. The meeting |
| CommitteeMember_ID | ID | required | → CommitteeMember. The committee member |
| Attendance_Status | Status | required | Constrained: Present / Absent / Excused / Partial |
| Arrival_Time | Timestamp | optional | Required when Attendance_Status is 'Present' or 'Partial' |
| Departure_Time | Timestamp | optional | Recorded when a member leaves before adjournment |

## Cross-row constraints

- **MeetingAttendance**: One attendance row per member per meeting: (Meeting_ID, CommitteeMember_ID) is unique.
- **Meeting**: Quorum_Met is required when Meeting_Status is 'Convened' or 'Adjourned'.

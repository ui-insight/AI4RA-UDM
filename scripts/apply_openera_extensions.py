"""Apply OpenERA-proposed UDM extensions to udm_schema.json.

Source proposals:
  - docs/governance/rfa-schema-extension.md  (RFA scalars + RFARequirement + ProposalChecklistItem)
  - docs/governance/submission-schema-extension.md  (SubmissionProfile/Package/Attachment/Attempt/Event)

Ranked integration order (easiest -> hardest):
  Rank 1: ProposalChecklistItem (new table)
  Rank 2: Submission* hierarchy (5 new tables)
  Rank 3: RFA scalar columns (10 new cols on RFA)
  Rank 4: RFARequirement additive redesign (6 new cols + vocabulary expansion)

Also updates:
  - docs/data/udm_schema.json          (mirror of root udm_schema.json)
  - docs/data/relationships.json       (new FKs)
  - docs/data/data-dictionary.json     (new table + column entries)

Run from repo root:
    python scripts/apply_openera_extensions.py
"""

import json
from collections import OrderedDict
from pathlib import Path


def col(type_, desc, synonyms="", *,
        pk=False, required=False, unique=False, auto_inc=False,
        ref_table=None, ref_col=None, allowed=None, default=None, pii=False):
    c = OrderedDict()
    c["type"] = type_
    c["primary_key"] = pk
    c["required"] = required
    c["unique"] = unique
    c["auto_increment"] = auto_inc
    if ref_table:
        c["references"] = {"table": ref_table, "column": ref_col}
    if allowed:
        c["allowed_values"] = allowed
    if default is not None:
        c["default"] = default
    c["description"] = desc
    if synonyms:
        c["synonyms"] = synonyms
    if pii:
        c["pii"] = True
    return c


# ---------------------------------------------------------------------------
# Rank 3 — RFA scalar column additions (10 new columns)
# ---------------------------------------------------------------------------
RFA_NEW_COLUMNS = [
    ("Submission_Deadline", col(
        "DATE",
        "Primary submission deadline for the opportunity",
        "Deadline, Due Date")),
    ("LOI_Deadline", col(
        "DATE",
        "Letter of intent deadline",
        "LOI Due Date")),
    ("Preproposal_Deadline", col(
        "DATE",
        "Pre-proposal or preliminary deadline",
        "Preliminary Deadline")),
    ("Announcement_Date", col(
        "DATE",
        "Date the RFA was published",
        "Published Date, Release Date")),
    ("Funding_Floor", col(
        "DECIMAL(18,2)",
        "Minimum award amount",
        "Min Award, Floor")),
    ("Funding_Ceiling", col(
        "DECIMAL(18,2)",
        "Maximum award amount per year",
        "Max Award, Ceiling")),
    ("Expected_Awards", col(
        "INT",
        "Number of awards expected to be made",
        "Award Count")),
    ("Max_Duration_Months", col(
        "INT",
        "Maximum project duration in months",
        "Duration, Project Length")),
    ("Submission_Method", col(
        "VARCHAR(100)",
        "Sponsor portal or mechanism used for submission (Research.gov, eRA Commons, Grants.gov, etc.)",
        "Portal, Submission System")),
    ("RFA_Status", col(
        "VARCHAR(50)",
        "Lifecycle status of the opportunity",
        "Status",
        allowed=["Active", "Closed", "Superseded", "Cancelled"],
        default="Active",
        required=True)),
]


# ---------------------------------------------------------------------------
# Rank 4 — RFARequirement additive redesign (6 new columns + category expansion)
# ---------------------------------------------------------------------------
RFAREQ_NEW_COLUMNS = [
    ("Requirement_Code", col(
        "VARCHAR(50)",
        "Machine-readable short code identifying the requirement within its category",
        "Code")),
    ("Format_Spec", col(
        "TEXT",
        "Formatting specification for document or formatting requirements",
        "Formatting, Format Details")),
    ("Sort_Order", col(
        "INT",
        "Display order within category",
        "Order",
        default=0)),
    ("Source_Section", col(
        "VARCHAR(255)",
        "Origin section in the source document, or structured vocabulary (sponsor_default, rfa_specific) for AI-generated document requirements",
        "Source, Origin")),
    ("Structured_Rule_Type", col(
        "VARCHAR(50)",
        "Normalized sponsor-eligibility rule type for machine-checkable ELIGIBILITY requirements (e.g., degree_required, early_career)",
        "Rule Type")),
    ("Structured_Rule_Value", col(
        "VARCHAR(255)",
        "Parameter value paired with Structured_Rule_Type (e.g., PhD, 1, true, Research.gov)",
        "Rule Value")),
]

RFAREQ_CATEGORY_VALUES = [
    "Eligibility",
    "Budget",
    "Format",
    "Compliance",
    "Reporting",
    "Personnel",
    "Document",
    "Review_Criterion",
    "Submission",
    "Deadline",
    "Special_Condition",
    "PAPPG_Deviation",
    "Other",
]


# ---------------------------------------------------------------------------
# Rank 1 — ProposalChecklistItem (new table)
# ---------------------------------------------------------------------------
def build_proposal_checklist_item():
    return {
        "columns": OrderedDict([
            ("ChecklistItem_ID", col(
                "INT",
                "Primary key for checklist item",
                "Checklist ID",
                pk=True, auto_inc=True)),
            ("Proposal_ID", col(
                "VARCHAR(50)",
                "Proposal this checklist item belongs to",
                "Proposal",
                required=True,
                ref_table="Proposal", ref_col="Proposal_ID")),
            ("RFARequirement_ID", col(
                "INT",
                "Source requirement on the associated RFA (null for custom items or internal review tasks)",
                "Source Requirement",
                ref_table="RFARequirement", ref_col="RFARequirement_ID")),
            ("Requirement_Category", col(
                "VARCHAR(50)",
                "Category of this checklist item (copied from source requirement, or a workflow namespace such as budget_review / compliance_review)",
                "Category")),
            ("Requirement_Code", col(
                "VARCHAR(50)",
                "Machine-readable code copied from source requirement",
                "Code")),
            ("Label", col(
                "VARCHAR(255)",
                "Display label for the checklist item",
                "Name, Title",
                required=True)),
            ("Description", col(
                "TEXT",
                "Detailed description or reviewer guidance",
                "Details")),
            ("Page_Limit", col(
                "INT",
                "Page limit copied from source requirement",
                "Pages")),
            ("Format_Spec", col(
                "TEXT",
                "Formatting specification copied from source requirement",
                "Format")),
            ("Is_Required", col(
                "BOOLEAN",
                "Whether the item is mandatory or optional",
                "Required, Mandatory",
                default=True)),
            ("Sort_Order", col(
                "INT",
                "Display order",
                "Order",
                default=0)),
            ("Status", col(
                "VARCHAR(50)",
                "Current completion status",
                "Progress",
                allowed=["Not Started", "In Progress", "Complete", "Not Applicable"],
                default="Not Started",
                required=True)),
            ("Assignee_Personnel_ID", col(
                "VARCHAR(50)",
                "Person assigned to complete this item",
                "Assignee, Owner",
                ref_table="Personnel", ref_col="Personnel_ID")),
            ("Notes", col(
                "TEXT",
                "Team notes or reviewer comments on this item",
                "Comments")),
            ("Completed_Date", col(
                "DATE",
                "Date the item was marked complete",
                "Done Date")),
            ("Document_ID", col(
                "INT",
                "Document that fulfills this checklist item",
                "Attachment",
                ref_table="Document", ref_col="Document_ID")),
        ]),
        "description": (
            "Per-proposal checklist tracking preparation progress against RFA requirements and internal review tasks. "
            "Separates per-proposal state (status, assignee, completion, notes, document link) from the RFA-level "
            "template in RFARequirement so that multiple proposals can target the same opportunity with independent "
            "checklists."
        ),
        "synonyms": "Proposal Checklist, Preparation Checklist, Review Tasks",
    }


# ---------------------------------------------------------------------------
# Rank 2 — Submission hierarchy (5 new tables)
# ---------------------------------------------------------------------------
def build_submission_profile():
    return {
        "columns": OrderedDict([
            ("Submission_Profile_ID", col(
                "VARCHAR(50)",
                "Primary key (UUID) for the submission profile",
                "Profile ID",
                pk=True, required=True)),
            ("Profile_Name", col(
                "VARCHAR(255)",
                "Human-readable label for the profile",
                "Name",
                required=True)),
            ("Submission_System", col(
                "VARCHAR(50)",
                "Sponsor submission system identifier",
                "System",
                allowed=["grants_gov", "research_gov", "era_commons", "nspires", "manual", "other"],
                required=True)),
            ("Environment", col(
                "VARCHAR(50)",
                "Submission environment",
                "Env",
                allowed=["training", "production"],
                default="training",
                required=True)),
            ("Credential_Reference", col(
                "VARCHAR(255)",
                "Vault path or label for credentials (never credentials themselves)",
                "Credential Path",
                pii=True)),
            ("Organization_ID", col(
                "VARCHAR(50)",
                "Institution the profile belongs to",
                "Institution",
                required=True,
                ref_table="Organization", ref_col="Organization_ID")),
            ("Is_Active", col(
                "BOOLEAN",
                "Whether this profile is available for new submissions",
                "Active",
                default=True,
                required=True)),
            ("Description", col(
                "TEXT",
                "Free-text description of the profile",
                "Notes")),
        ]),
        "description": (
            "Institution/sponsor submission system configuration. One profile per organization/system/environment "
            "combination, referencing credentials by external secret-store path rather than storing them."
        ),
        "synonyms": "Submission Configuration, Sponsor Profile",
    }


def build_submission_package():
    return {
        "columns": OrderedDict([
            ("Submission_Package_ID", col(
                "INT",
                "Primary key for submission package",
                "Package ID",
                pk=True, auto_inc=True)),
            ("Proposal_ID", col(
                "VARCHAR(50)",
                "Proposal this package was assembled from",
                "Proposal",
                required=True,
                ref_table="Proposal", ref_col="Proposal_ID")),
            ("Package_Version", col(
                "INT",
                "Version number within the proposal",
                "Version",
                default=1,
                required=True)),
            ("Assembly_Status", col(
                "VARCHAR(50)",
                "Current status of the package",
                "Status",
                allowed=["pending", "assembled", "validated", "failed"],
                default="pending",
                required=True)),
            ("Preflight_Results", col(
                "TEXT",
                "JSON blob storing validation and preflight check results",
                "Validation")),
            ("Assembled_At", col(
                "TIMESTAMP",
                "Timestamp when the package was assembled",
                "Assembly Time")),
            ("Package_Hash", col(
                "VARCHAR(128)",
                "SHA-256 hash of the entire package for integrity verification",
                "Hash, Checksum")),
            ("Assembled_By_User_ID", col(
                "VARCHAR(50)",
                "User who assembled the package",
                "Assembler",
                ref_table="Personnel", ref_col="Personnel_ID")),
        ]),
        "description": (
            "Immutable point-in-time snapshot of the documents and metadata assembled for submission to a sponsor. "
            "Once an attempt references a package, the package and its attachments should not be modified."
        ),
        "synonyms": "Submission Snapshot, Proposal Package",
    }


def build_submission_attachment():
    return {
        "columns": OrderedDict([
            ("Submission_Attachment_ID", col(
                "INT",
                "Primary key for submission attachment",
                "Attachment ID",
                pk=True, auto_inc=True)),
            ("Submission_Package_ID", col(
                "INT",
                "Package this attachment belongs to",
                "Package",
                required=True,
                ref_table="SubmissionPackage", ref_col="Submission_Package_ID")),
            ("Document_ID", col(
                "INT",
                "Source document record (RESTRICT delete — submitted documents cannot be removed)",
                "Document",
                required=True,
                ref_table="Document", ref_col="Document_ID")),
            ("Sponsor_Document_Type", col(
                "VARCHAR(100)",
                "Sponsor-side document type code",
                "Sponsor Type",
                allowed=[
                    "project_narrative", "budget_narrative", "biographical_sketch",
                    "current_pending", "facilities_equipment", "data_management_plan",
                    "letter_of_support", "subaward_budget", "other_attachment",
                ])),
            ("File_Hash_At_Packaging", col(
                "VARCHAR(128)",
                "SHA-256 hash of the document file captured at packaging time",
                "Hash, Checksum",
                required=True)),
            ("Sort_Order", col(
                "INT",
                "Display or submission order within the package",
                "Order",
                default=0)),
        ]),
        "description": (
            "Package manifest entry linking a submission package to a document. Captures the document's file hash "
            "at packaging time so submission integrity can be verified later even if the source document is updated."
        ),
        "synonyms": "Package Manifest Entry, Submission Document",
    }


def build_submission_attempt():
    return {
        "columns": OrderedDict([
            ("Submission_Attempt_ID", col(
                "INT",
                "Primary key for submission attempt",
                "Attempt ID",
                pk=True, auto_inc=True)),
            ("Submission_Package_ID", col(
                "INT",
                "Package transmitted by this attempt",
                "Package",
                required=True,
                ref_table="SubmissionPackage", ref_col="Submission_Package_ID")),
            ("Submission_Profile_ID", col(
                "VARCHAR(50)",
                "Profile used for this attempt (SET NULL on profile deletion)",
                "Profile",
                ref_table="SubmissionProfile", ref_col="Submission_Profile_ID")),
            ("Submission_System", col(
                "VARCHAR(50)",
                "Sponsor system used (denormalized from profile at attempt creation for historical accuracy)",
                "System",
                allowed=["grants_gov", "research_gov", "era_commons", "nspires", "manual", "other"],
                required=True)),
            ("Environment", col(
                "VARCHAR(50)",
                "Submission environment (denormalized from profile at attempt creation)",
                "Env",
                allowed=["training", "production"],
                required=True)),
            ("Status", col(
                "VARCHAR(50)",
                "Current status in the attempt lifecycle",
                "Status",
                allowed=["submitting", "submitted", "received", "validated", "rejected", "accepted", "error"],
                default="submitting",
                required=True)),
            ("External_Tracking_Number", col(
                "VARCHAR(255)",
                "Sponsor-assigned tracking identifier (e.g., Grants.gov tracking number)",
                "Tracking Number")),
            ("Submitted_At", col(
                "TIMESTAMP",
                "Timestamp when the attempt was initiated",
                "Submission Time")),
            ("Response_Data", col(
                "TEXT",
                "JSON blob storing raw sponsor response data",
                "Response")),
            ("Error_Detail", col(
                "TEXT",
                "Error message or diagnostic detail for failed attempts",
                "Error")),
            ("Submitted_By_User_ID", col(
                "VARCHAR(50)",
                "User who initiated the attempt",
                "Submitter",
                ref_table="Personnel", ref_col="Personnel_ID")),
        ]),
        "description": (
            "Record of each outbound transmission of a submission package to an external sponsor system. Multiple "
            "attempts may reference the same package (retry after error, resubmit to a different environment). "
            "Follows a defined status state machine: submitting -> submitted -> received -> validated -> accepted/rejected/error."
        ),
        "synonyms": "Submission Transmission, Outbound Attempt",
    }


def build_submission_event():
    return {
        "columns": OrderedDict([
            ("Submission_Event_ID", col(
                "INT",
                "Primary key for submission event",
                "Event ID",
                pk=True, auto_inc=True)),
            ("Submission_Attempt_ID", col(
                "INT",
                "Attempt this event belongs to",
                "Attempt",
                required=True,
                ref_table="SubmissionAttempt", ref_col="Submission_Attempt_ID")),
            ("Event_Type", col(
                "VARCHAR(50)",
                "Type of event",
                "Type",
                allowed=["status_change", "agency_note", "operator_action", "error", "validation_result"],
                required=True)),
            ("Event_Timestamp", col(
                "TIMESTAMP",
                "When the event occurred",
                "Timestamp",
                required=True)),
            ("Previous_Status", col(
                "VARCHAR(50)",
                "Status before a status_change event",
                "From Status")),
            ("New_Status", col(
                "VARCHAR(50)",
                "Status after a status_change event",
                "To Status")),
            ("External_Data", col(
                "TEXT",
                "JSON blob for agency-provided data or validation details",
                "Agency Data")),
            ("Description", col(
                "TEXT",
                "Human-readable description of the event",
                "Notes")),
            ("User_ID", col(
                "VARCHAR(50)",
                "User associated with the event (operator or reviewer)",
                "User",
                ref_table="Personnel", ref_col="Personnel_ID")),
        ]),
        "description": (
            "Granular audit events for a submission attempt. Each event captures one discrete occurrence in the "
            "attempt lifecycle: status transitions, agency feedback, operator notes, validation results, or errors."
        ),
        "synonyms": "Submission Audit Event, Attempt Event",
    }


# ---------------------------------------------------------------------------
# Apply all changes to a schema dict
# ---------------------------------------------------------------------------
def apply_changes(schema):
    tables = schema["tables"]

    # Rank 3: RFA scalar columns
    rfa_cols = tables["RFA"]["columns"]
    for name, definition in RFA_NEW_COLUMNS:
        if name not in rfa_cols:
            rfa_cols[name] = definition

    # Rank 4: RFARequirement additive redesign
    rfareq_cols = tables["RFARequirement"]["columns"]
    cat = rfareq_cols.get("Requirement_Category")
    if cat is not None:
        cat["allowed_values"] = RFAREQ_CATEGORY_VALUES
        cat["description"] = (
            "Category of requirement. Expanded vocabulary covers documents, formatting, eligibility, review "
            "criteria, budget constraints, submission mechanics, deadlines, compliance, and solicitation-specific "
            "deviations from the sponsor's parent guide."
        )
    for name, definition in RFAREQ_NEW_COLUMNS:
        if name not in rfareq_cols:
            rfareq_cols[name] = definition
    # Clarify that per-proposal state should move to ProposalChecklistItem
    if "Compliance_Status" in rfareq_cols:
        rfareq_cols["Compliance_Status"]["description"] = (
            "Legacy per-proposal compliance status. New integrations should track per-proposal state in "
            "ProposalChecklistItem; this field is retained for backwards compatibility with earlier UDM consumers."
        )
    if "Notes" in rfareq_cols:
        rfareq_cols["Notes"]["description"] = (
            "Legacy notes on compliance with this requirement. New integrations should use "
            "ProposalChecklistItem.Notes for per-proposal commentary."
        )

    # Rank 1: ProposalChecklistItem
    if "ProposalChecklistItem" not in tables:
        tables["ProposalChecklistItem"] = build_proposal_checklist_item()

    # Rank 2: Submission hierarchy
    if "SubmissionProfile" not in tables:
        tables["SubmissionProfile"] = build_submission_profile()
    if "SubmissionPackage" not in tables:
        tables["SubmissionPackage"] = build_submission_package()
    if "SubmissionAttachment" not in tables:
        tables["SubmissionAttachment"] = build_submission_attachment()
    if "SubmissionAttempt" not in tables:
        tables["SubmissionAttempt"] = build_submission_attempt()
    if "SubmissionEvent" not in tables:
        tables["SubmissionEvent"] = build_submission_event()

    schema["table_count"] = len(tables)

    return schema


# ---------------------------------------------------------------------------
# Derived artifacts: relationships.json and data-dictionary.json
# ---------------------------------------------------------------------------
def derive_relationships(schema):
    rels = []
    seen = set()
    for table_name, tbl in schema["tables"].items():
        for col_name, meta in tbl["columns"].items():
            ref = meta.get("references")
            if not ref:
                continue
            key = (table_name, col_name, ref["table"], ref["column"])
            if key in seen:
                continue
            seen.add(key)
            rels.append({
                "from_table": table_name,
                "from_column": col_name,
                "to_table": ref["table"],
                "to_column": ref["column"],
            })
    return rels


def derive_data_dictionary(schema):
    out = OrderedDict()
    for tname, tbl in schema["tables"].items():
        cols = []
        for cname, meta in tbl["columns"].items():
            entry = {
                "name": cname,
                "description": meta.get("description", ""),
                "synonyms": meta.get("synonyms", ""),
                "pii": bool(meta.get("pii", False)),
            }
            cols.append(entry)
        out[tname] = {
            "name": tname,
            "description": tbl.get("description", ""),
            "synonyms": tbl.get("synonyms", ""),
            "columns": cols,
        }
    return out


def update_existing_dictionary(existing_dict, schema):
    """Preserve existing table entries where possible; add new tables and columns from the schema."""
    existing_tables = existing_dict.get("tables", {})
    for tname, tbl in schema["tables"].items():
        if tname not in existing_tables:
            existing_tables[tname] = {
                "name": tname,
                "description": tbl.get("description", ""),
                "synonyms": tbl.get("synonyms", ""),
                "columns": [
                    {
                        "name": cname,
                        "description": meta.get("description", ""),
                        "synonyms": meta.get("synonyms", ""),
                        "pii": bool(meta.get("pii", False)),
                    }
                    for cname, meta in tbl["columns"].items()
                ],
            }
            continue
        entry = existing_tables[tname]
        if tbl.get("description"):
            entry["description"] = tbl["description"]
        if tbl.get("synonyms"):
            entry["synonyms"] = tbl["synonyms"]
        known_cols = {c["name"] for c in entry.get("columns", [])}
        schema_col_names = list(tbl["columns"].keys())
        updated_cols = list(entry.get("columns", []))
        for cname in schema_col_names:
            meta = tbl["columns"][cname]
            new_entry = {
                "name": cname,
                "description": meta.get("description", ""),
                "synonyms": meta.get("synonyms", ""),
                "pii": bool(meta.get("pii", False)),
            }
            if cname in known_cols:
                for i, c in enumerate(updated_cols):
                    if c["name"] == cname:
                        updated_cols[i] = new_entry
                        break
            else:
                updated_cols.append(new_entry)
        entry["columns"] = updated_cols
    existing_dict["tables"] = existing_tables
    existing_dict["table_count"] = len(existing_tables)
    return existing_dict


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    repo_root = Path(__file__).resolve().parent.parent
    schema_paths = [
        repo_root / "udm_schema.json",
        repo_root / "docs" / "data" / "udm_schema.json",
    ]
    rels_path = repo_root / "docs" / "data" / "relationships.json"
    dict_path = repo_root / "docs" / "data" / "data-dictionary.json"

    # Apply to root schema file
    with open(schema_paths[0]) as f:
        schema = json.load(f, object_pairs_hook=OrderedDict)
    schema = apply_changes(schema)

    # Recompute relationships
    rels = derive_relationships(schema)
    schema["relationship_count"] = len(rels)

    # Write both schema files (mirrored)
    for p in schema_paths:
        with open(p, "w") as f:
            json.dump(schema, f, indent=2)
            f.write("\n")

    # Write relationships.json
    rels_out = OrderedDict()
    rels_out["relationships"] = rels
    rels_out["relationship_count"] = len(rels)
    with open(rels_path, "w") as f:
        json.dump(rels_out, f, indent=2)
        f.write("\n")

    # Update data dictionary
    with open(dict_path) as f:
        existing_dict = json.load(f, object_pairs_hook=OrderedDict)
    updated_dict = update_existing_dictionary(existing_dict, schema)
    with open(dict_path, "w") as f:
        json.dump(updated_dict, f, indent=2)
        f.write("\n")

    # Summary
    tables = schema["tables"]
    new_tables = [
        "ProposalChecklistItem",
        "SubmissionProfile",
        "SubmissionPackage",
        "SubmissionAttachment",
        "SubmissionAttempt",
        "SubmissionEvent",
    ]
    print("OpenERA extensions applied:")
    print(f"  RFA: +{len(RFA_NEW_COLUMNS)} columns (now {len(tables['RFA']['columns'])} total)")
    print(f"  RFARequirement: +{len(RFAREQ_NEW_COLUMNS)} columns, expanded category vocabulary "
          f"(now {len(tables['RFARequirement']['columns'])} total)")
    for t in new_tables:
        print(f"  + {t}: {len(tables[t]['columns'])} columns")
    print(f"\nTotal tables: {len(tables)}")
    print(f"Total relationships: {len(rels)}")


if __name__ == "__main__":
    main()

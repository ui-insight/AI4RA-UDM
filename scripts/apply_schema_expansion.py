"""Apply UDM schema expansion changes from issues #6, #9, #16, #17, #18, #19, #21.

This script modifies udm_schema.json in place. Run from repo root:
    python scripts/apply_schema_expansion.py
"""

import json
from collections import OrderedDict
from pathlib import Path


def col(type_: str, desc: str, synonyms: str = "", *,
        pk=False, required=False, unique=False, auto_inc=False,
        ref_table=None, ref_col=None, allowed=None, default=None, pii=False):
    """Helper to build a column definition dict."""
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


def apply_changes(schema):
    tables = schema["tables"]

    # ---------------------------------------------------------------
    # #17 — Add Honorific and Name_Suffix to Personnel
    # ---------------------------------------------------------------
    personnel_cols = tables["Personnel"]["columns"]
    new_cols = OrderedDict()
    for k, v in personnel_cols.items():
        if k == "First_Name":
            new_cols["Honorific"] = col(
                "VARCHAR(20)",
                "Honorific or title prefix (Dr., Prof., Rev., Mr., Ms.)",
                "Title, Prefix",
            )
        new_cols[k] = v
        if k == "Last_Name":
            new_cols["Name_Suffix"] = col(
                "VARCHAR(20)",
                "Name suffix (Jr., III, PhD, MD)",
                "Suffix",
            )
    tables["Personnel"]["columns"] = new_cols

    # ---------------------------------------------------------------
    # #16 — Replace Subaward.PI_Name with PI_Personnel_ID FK
    # ---------------------------------------------------------------
    sub_cols = tables["Subaward"]["columns"]
    new_cols = OrderedDict()
    for k, v in sub_cols.items():
        if k == "PI_Name":
            new_cols["PI_Personnel_ID"] = col(
                "VARCHAR(50)",
                "Principal investigator at subrecipient institution",
                "Subrecipient PI, Sub PI ID",
                ref_table="Personnel", ref_col="Personnel_ID",
            )
        else:
            new_cols[k] = v
    tables["Subaward"]["columns"] = new_cols

    # ---------------------------------------------------------------
    # #18 — Add Risk_Level to Award and Proposal
    # ---------------------------------------------------------------
    risk_col = col(
        "VARCHAR(20)",
        "Risk assessment level (Low, Medium, High)",
        "Risk",
        allowed=["Low", "Medium", "High"],
    )
    tables["Award"]["columns"]["Risk_Level"] = risk_col.copy()
    tables["Proposal"]["columns"]["Risk_Level"] = risk_col.copy()

    # ---------------------------------------------------------------
    # #21 — Add ApplicationSystem table
    # ---------------------------------------------------------------
    tables["ApplicationSystem"] = {
        "columns": OrderedDict([
            ("ApplicationSystem_ID", col(
                "VARCHAR(50)", "Primary key for application system",
                "System ID", pk=True)),
            ("System_Name", col(
                "VARCHAR(255)", "Name of the application or system",
                "Name, App Name", required=True)),
            ("System_Type", col(
                "VARCHAR(50)", "Type of system (Research Admin, ERP, Sponsor Portal, Ticketing, Reference Tool, Reporting, Other)",
                "Type",
                allowed=["Research Admin", "ERP", "Sponsor Portal", "Ticketing",
                         "Reference Tool", "Reporting", "Other"])),
            ("Vendor_Name", col(
                "VARCHAR(255)", "Vendor or provider of the system",
                "Vendor, Provider")),
            ("Owning_Organization_ID", col(
                "VARCHAR(50)", "Organization that owns or administers this system",
                "Owner Org",
                ref_table="Organization", ref_col="Organization_ID")),
            ("Primary_URL", col(
                "VARCHAR(500)", "Primary URL or endpoint for the system",
                "URL, Link")),
            ("Description", col(
                "TEXT", "Description of the system and its role in research administration",
                "Details")),
            ("Is_Active", col(
                "BOOLEAN", "Whether the system is currently in use",
                "Active", default=True)),
        ]),
        "description": "Catalog of operational systems, portals, and tools used in research administration workflows",
        "synonyms": "System, Application, Platform, Tool",
    }

    # ---------------------------------------------------------------
    # #6 — Add ServiceRequest table
    # ---------------------------------------------------------------
    tables["ServiceRequest"] = {
        "columns": OrderedDict([
            ("ServiceRequest_ID", col(
                "VARCHAR(50)", "Primary key for service request",
                "Request ID, Ticket ID", pk=True)),
            ("ServiceRequest_Title", col(
                "VARCHAR(255)", "Title or subject of the service request",
                "Title, Subject")),
            ("ServiceRequest_Description", col(
                "TEXT", "Detailed description of the request",
                "Description, Details")),
            ("Request_Type", col(
                "VARCHAR(100)", "Type of request (e.g., Subaward Request, Budget Transfer, Account Setup)",
                "Type, Category")),
            ("Request_Status", col(
                "VARCHAR(50)", "Current status of the request",
                "Status",
                allowed=["New", "In Progress", "Pending", "Resolved", "Closed", "Cancelled"])),
            ("Request_Priority", col(
                "VARCHAR(50)", "Priority level of the request",
                "Priority",
                allowed=["Low", "Normal", "High", "Urgent", "Critical"])),
            ("Requestor_Personnel_ID", col(
                "VARCHAR(50)", "Person who submitted the request",
                "Requestor, Submitted By",
                ref_table="Personnel", ref_col="Personnel_ID")),
            ("Assigned_Personnel_ID", col(
                "VARCHAR(50)", "Person assigned to handle the request",
                "Assignee, Responsible Person",
                ref_table="Personnel", ref_col="Personnel_ID")),
            ("Assigned_Group", col(
                "VARCHAR(255)", "Team or group responsible for the request",
                "Team, Group")),
            ("ApplicationSystem_ID", col(
                "VARCHAR(50)", "System where the request originated or is tracked",
                "Source System",
                ref_table="ApplicationSystem", ref_col="ApplicationSystem_ID")),
            ("Related_Award_ID", col(
                "VARCHAR(50)", "Award related to this request, if applicable",
                "Award",
                ref_table="Award", ref_col="Award_ID")),
            ("Related_Proposal_ID", col(
                "VARCHAR(50)", "Proposal related to this request, if applicable",
                "Proposal",
                ref_table="Proposal", ref_col="Proposal_ID")),
            ("Created_Date", col(
                "TIMESTAMP", "Date and time the request was created",
                "Created, Opened")),
            ("Resolved_Date", col(
                "TIMESTAMP", "Date and time the request was resolved",
                "Resolved, Completed")),
            ("Modified_Date", col(
                "TIMESTAMP", "Date and time the request was last modified",
                "Updated, Last Modified")),
        ]),
        "description": "Service requests and tickets from institutional ticketing systems (TDX, ServiceNow, Jira) related to research administration operations",
        "synonyms": "Ticket, Work Request, Service Ticket",
    }

    # ---------------------------------------------------------------
    # #9 — Add RFARequirement table
    # ---------------------------------------------------------------
    tables["RFARequirement"] = {
        "columns": OrderedDict([
            ("RFARequirement_ID", col(
                "INT", "Primary key for RFA requirement",
                "Requirement ID", pk=True, auto_inc=True)),
            ("RFA_ID", col(
                "VARCHAR(50)", "Funding opportunity this requirement belongs to",
                "RFA, Opportunity",
                required=True,
                ref_table="RFA", ref_col="RFA_ID")),
            ("Requirement_Text", col(
                "TEXT", "Text of the specific requirement from the funding announcement",
                "Requirement, Text", required=True)),
            ("Requirement_Category", col(
                "VARCHAR(100)", "Category of requirement (e.g., Eligibility, Budget, Format, Compliance, Reporting)",
                "Category, Type",
                allowed=["Eligibility", "Budget", "Format", "Compliance",
                         "Reporting", "Personnel", "Other"])),
            ("Page_Reference", col(
                "VARCHAR(50)", "Page number or section reference in the FOA document",
                "Page, Section")),
            ("Is_Mandatory", col(
                "BOOLEAN", "Whether this requirement is mandatory or recommended",
                "Mandatory, Required", default=True)),
            ("Compliance_Status", col(
                "VARCHAR(50)", "Status of compliance with this requirement",
                "Status",
                allowed=["Not Started", "In Progress", "Met", "Not Applicable", "Waived"],
                default="Not Started")),
            ("Notes", col(
                "TEXT", "Notes or comments about compliance with this requirement",
                "Comments")),
        ]),
        "description": "Specific requirements extracted from funding opportunity announcements (FOA/RFA) for compliance tracking during proposal development and post-award management",
        "synonyms": "FOA Requirement, Solicitation Requirement",
    }

    # ---------------------------------------------------------------
    # #19 — Add ProjectCohort and CohortParticipation tables
    # ---------------------------------------------------------------
    tables["ProjectCohort"] = {
        "columns": OrderedDict([
            ("ProjectCohort_ID", col(
                "VARCHAR(50)", "Primary key for project cohort",
                "Cohort ID", pk=True)),
            ("Project_ID", col(
                "VARCHAR(50)", "Program or project this cohort belongs to",
                "Program, Project",
                required=True,
                ref_table="Project", ref_col="Project_ID")),
            ("Cohort_Name", col(
                "VARCHAR(255)", "Name of the cohort or track",
                "Name, Track Name", required=True)),
            ("Cohort_Type", col(
                "VARCHAR(50)", "Type of cohort (e.g., Grant Writing, CAREER, Mentoring, Seed Competition)",
                "Type",
                allowed=["Grant Writing", "CAREER", "Mentoring",
                         "Seed Competition", "Boot Camp", "Other"])),
            ("Cohort_Status", col(
                "VARCHAR(50)", "Current status of the cohort",
                "Status",
                allowed=["Planning", "Active", "Completed", "Cancelled"],
                default="Planning")),
            ("Start_Date", col(
                "DATE", "Cohort start date",
                "Begin Date")),
            ("End_Date", col(
                "DATE", "Cohort end date",
                "End Date")),
            ("Description", col(
                "TEXT", "Description of the cohort program and objectives",
                "Details")),
        ]),
        "description": "Cohorts or tracks within faculty development and research support programs",
        "synonyms": "Program Cohort, Track, Program Group",
    }

    tables["CohortParticipation"] = {
        "columns": OrderedDict([
            ("CohortParticipation_ID", col(
                "VARCHAR(50)", "Primary key for cohort participation record",
                "Participation ID", pk=True)),
            ("ProjectCohort_ID", col(
                "VARCHAR(50)", "Cohort the participant is enrolled in",
                "Cohort",
                required=True,
                ref_table="ProjectCohort", ref_col="ProjectCohort_ID")),
            ("Personnel_ID", col(
                "VARCHAR(50)", "Participant in the cohort",
                "Participant, Person",
                required=True,
                ref_table="Personnel", ref_col="Personnel_ID")),
            ("Related_Proposal_ID", col(
                "VARCHAR(50)", "Proposal being developed as part of this program",
                "Target Proposal",
                ref_table="Proposal", ref_col="Proposal_ID")),
            ("Related_Project_ID", col(
                "VARCHAR(50)", "Project being developed as part of this program",
                "Target Project",
                ref_table="Project", ref_col="Project_ID")),
            ("Coach_Personnel_ID", col(
                "VARCHAR(50)", "Coach, mentor, or partner assigned to this participant",
                "Coach, Mentor, Partner",
                ref_table="Personnel", ref_col="Personnel_ID")),
            ("Participation_Status", col(
                "VARCHAR(50)", "Current participation status",
                "Status",
                allowed=["Enrolled", "Active", "Completed", "Withdrawn", "Deferred"],
                default="Enrolled")),
            ("Joined_Date", col(
                "DATE", "Date participant joined the cohort",
                "Enrollment Date, Start Date")),
            ("Completed_Date", col(
                "DATE", "Date participant completed or left the cohort",
                "Completion Date, End Date")),
            ("Comments", col(
                "TEXT", "Notes about this participant's involvement",
                "Notes")),
        ]),
        "description": "Enrollment of personnel in faculty development cohorts with coach assignments and related proposal/project tracking",
        "synonyms": "Cohort Enrollment, Program Participation",
    }

    return schema


def main():
    path = Path(__file__).resolve().parent.parent / "udm_schema.json"
    with open(path) as f:
        schema = json.load(f, object_pairs_hook=OrderedDict)

    schema = apply_changes(schema)

    with open(path, "w") as f:
        json.dump(schema, f, indent=2)
        f.write("\n")

    # Count changes
    tables = schema["tables"]
    new_tables = ["ApplicationSystem", "ServiceRequest", "RFARequirement",
                  "ProjectCohort", "CohortParticipation"]
    print("Schema expansion applied:")
    print(f"  - Personnel: added Honorific, Name_Suffix (#17)")
    print(f"  - Subaward: replaced PI_Name with PI_Personnel_ID FK (#16)")
    print(f"  - Award: added Risk_Level (#18)")
    print(f"  - Proposal: added Risk_Level (#18)")
    for t in new_tables:
        n = len(tables[t]["columns"])
        print(f"  - {t}: new table with {n} columns")
    print(f"\nTotal tables: {len(tables)}")


if __name__ == "__main__":
    main()

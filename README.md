# AI4RA Unified Data Model (UDM)

A shared set of definitions for research administration data, so systems can exchange it and institutions can compare it.

**Explore the model: [ui-insight.github.io/AI4RA-UDM](https://ui-insight.github.io/AI4RA-UDM/)**

**Join the conversation:** [join the AI4RA list](https://groups.ai4ra.uidaho.edu/g/main/join), also linked from the [AI4RA website](https://ai4ra.uidaho.edu/), and post using the [#UDM](https://groups.ai4ra.uidaho.edu/g/main/search?q=%23UDM&ct=1) hashtag. You don't need a GitHub account.

**Current version: v5.1.0** (released 2026-11-06).. This is a draft, written by a small team at one institution, and it needs readers from other institutions to get it right.

## Why it exists

Research administration data is scattered across institutions and proprietary systems, and each system names and defines things its own way. When two systems disagree on what counts as an active award, someone has to work out by hand which one is right.

The UDM is a specification, not a database. It defines the tables, columns, relationships, and rules that should exist. Institutions keep their current systems, map their data to the UDM, and implement it in whatever technology fits.

## Where to find things

| You want to | Go to |
|---|---|
| Learn what a term means | [Glossary tab](https://ui-insight.github.io/AI4RA-UDM/) |
| See how records move through their statuses | [Statuses tab](https://ui-insight.github.io/AI4RA-UDM/) |
| Look up a table or column | [Data Dictionary and Explorer tabs](https://ui-insight.github.io/AI4RA-UDM/) |
| See how the UDM fits your systems | [Infrastructure tab](https://ui-insight.github.io/AI4RA-UDM/) |
| Read the full specification | [`vignettes/udm-system-of-record.md`](vignettes/udm-system-of-record.md) |
| Produce the NSF HERD survey from UDM data | [`vignettes/herd-report.md`](vignettes/herd-report.md) |
| Calculate shared metrics with sample queries | [`vignettes/udm-system-of-insight-views.md`](vignettes/udm-system-of-insight-views.md) |
| See what changed in each release | [`vignettes/CHANGELOG.md`](vignettes/CHANGELOG.md) |

## What it covers

Core modules are the capabilities every research office has, and every implementation includes them:

| Core module | Covers |
|---|---|
| **Actors** | People, organizations, their roles, credentials, and contact information |
| **Funding Cycle** | Funding opportunity through proposal, award, and closeout |
| **Effort** | Who is on a proposal or award, and effort certification |
| **Finance** | Budgets, accounting, transactions, rates, and capital assets |
| **Compliance** | Protocols, conflict of interest, other support, policy exceptions, and regulatory tracking |
| **Records** | Documents, communications, restrictions, deadlines, and approvals |

Optional modules are for capabilities only some institutions have. Governance, Compliance Protocols, Animal Research, Human Subjects, and Biosafety are [available now](vignettes/modules/). An Outputs module and an IP module are designed but not yet released.

## Using the UDM

The schema is published as JSON, with descriptions and common alternate names for each column to help with mapping:

| Endpoint | Contents |
|---|---|
| [`udm_schema.json`](https://ui-insight.github.io/AI4RA-UDM/data/udm_schema.json) | The complete schema. Most people only need this one |
| [`data-dictionary.json`](https://ui-insight.github.io/AI4RA-UDM/data/data-dictionary.json) | Descriptions, synonyms, and PII flags |
| [`relationships.json`](https://ui-insight.github.io/AI4RA-UDM/data/relationships.json) | Foreign key relationships |
| [`example-views.json`](https://ui-insight.github.io/AI4RA-UDM/data/example-views.json) | Example views with their SQL |
| [`glossary.csv`](https://ui-insight.github.io/AI4RA-UDM/data/glossary.csv) | The glossary |

These define the model and contain no institutional data. To generate a database schema and its reference rows:

```
python scripts/generate_ddl.py --list-dialects
python scripts/generate_ddl.py --dialect postgresql
python scripts/generate_seed.py --dialect postgresql
```

Add `--modules governance` to the DDL command to include an optional module. The generated files are also served under `/ddl/` on the site. The generators don't create cross-row rules or derived values, which the specification describes and you implement.

To adopt the UDM, map your local fields to UDM columns, add your local codes to `AllowedValues`, and adapt the example views to your reporting. An implementation or a vendor product can show that it conforms by [passing the conformance checker](vignettes/udm-conformance.md). Institutions can use the [model procurement language](vignettes/udm-procurement-language.md) to ask vendors for it.

## Versions

The current version is set in [`VERSION`](VERSION), and each release is published under [GitHub Releases](https://github.com/ui-insight/AI4RA-UDM/releases). While the UDM is in active development and has no production adopters, breaking changes can ship in a minor version and are marked as breaking in the [changelog](vignettes/CHANGELOG.md).

## Contributing

Design conversations happen on the [AI4RA list](https://groups.ai4ra.uidaho.edu/g/main/join) under `#UDM`, so everyone can join them. Raise problems and bugs as a [GitHub Issue](https://github.com/ui-insight/AI4RA-UDM/issues). See [CONTRIBUTING.md](CONTRIBUTING.md) for how to make a change, and the [Code of Conduct](CODE_OF_CONDUCT.md).

## License

Copyright 2025 Nathan Layman.

The AI4RA Unified Data Model is licensed in two parts:

- **The standard** (the schema, naming conventions and documentation) is licensed under [CC BY 4.0](LICENSE-CC-BY-4.0). Anyone, vendors included, can use it and build it into a product, with attribution required.
- **The code** (the scripts, the dashboard and the build workflows) is licensed under [Apache-2.0](LICENSE-APACHE-2.0).

The machine-readable schema files are available under either license, at your option. [NOTICE](NOTICE) lists which files fall under which license. It is the attribution notice under Apache-2.0 Section 4(d) and carries the attribution CC BY 4.0 requires: any redistribution of the work or a derivative must credit Nathan Layman as author, AI4RA, the University of Idaho, and NSF award 2427549. To cite the project, use [CITATION.cff](CITATION.cff).

The names "AI4RA Unified Data Model" and "AI4RA UDM" are reserved for conforming versions. See [NAME-POLICY.md](NAME-POLICY.md).

## Acknowledgments

The AI4RA Unified Data Model is a project of [AI4RA](https://ai4ra.uidaho.edu/) (AI for Research Administration) at the University of Idaho.

This material is based upon work supported by the U.S. National Science Foundation under the GRANTED program, [award number 2427549](https://www.nsf.gov/awardsearch/showAward?AWD_ID=2427549), "Crossing the Innovation Valley of Death: Democratizing Data and Artificial Intelligence for Research Administration". Any opinions, findings, and conclusions or recommendations expressed in this material are those of the author and do not necessarily reflect the views of the National Science Foundation.

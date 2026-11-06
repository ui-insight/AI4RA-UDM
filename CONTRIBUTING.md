# Contributing

The UDM is a draft, and it needs people who work in research administration to get it right. You don't need a GitHub account or a technical background to take part.

## Talk about the design

[Join the AI4RA list](https://groups.ai4ra.uidaho.edu/g/main/join), which is also linked from the [AI4RA website](https://ai4ra.uidaho.edu/), and post using the [#UDM](https://groups.ai4ra.uidaho.edu/g/main/search?q=%23UDM&ct=1) hashtag. This is the place for questions, feedback, and ideas about the model, such as:

- Does it describe an award, a sponsor, or a person the way you would?
- What does your office track that isn't here?
- What do you call something that it names differently?
- Does a glossary definition match how your office uses the term?

Design conversations happen on the list so everyone can join them, with or without GitHub. Please share public material only.

## Report a problem or bug

Raise problems and bugs as a [GitHub Issue](https://github.com/ui-insight/AI4RA-UDM/issues), such as a broken link, a failing check, or a mismatch between the schema and the docs. If you don't use GitHub, post them on the list.

## Make a change

A change to the standard has three parts, and they have to agree:

- **Schema:** `udm_schema.json` is the machine-readable definition.
- **Spec:** `vignettes/udm-system-of-record.md` and the docs in `vignettes/modules/` are written by hand. Update them along with the schema.
- **Status charts:** if a status or path changes, update the SVG charts in `dashboard/src/assets/`.

The glossary's source is `glossary.json`, and it's the reference for what terms mean. Edit it, then run `scripts/generate_glossary.py`. Definitions say what a thing is, without amounts, dates, or other details that change; point to the governing source for those. Add a source only when its text supports the definition.

Run these before opening a pull request:

| Check | What it confirms |
|---|---|
| `python scripts/validate_schema.py` | The schema is valid and the version matches everywhere |
| `python scripts/check_spec_sync.py` | The spec lists the same tables and columns as the schema |
| `python scripts/check_conformance.py --self-check` | The conformance checker still works |
| `python scripts/check_glossary.py` | Glossary references exist, and every lifecycle status and chart box has a term |
| `python scripts/generate_allowed_values_doc.py --check` | `vignettes/allowedvalues.md` is current. Run it without `--check` to regenerate it |

CI runs these on pull requests. When a change reaches `main`, CI rebuilds and publishes the dashboard and its data files.

A change to the standard must pass the conformance checker before a release may carry the AI4RA UDM name. See [NAME-POLICY.md](NAME-POLICY.md).

Log changes under `## [Unreleased]` in `vignettes/CHANGELOG.md`, and mark breaking changes. To set a version, edit `VERSION`, then run `python scripts/bump_version.py`. It updates the schema metadata, the README, the prose spec, and the conformance example, and moves the Unreleased entries under the new version. Add `--released YYYY-MM-DD` for a date other than today.

## License

By submitting a contribution you agree that it is licensed under the same terms as the part of the repository it changes, as set out in [NOTICE](NOTICE):

- [CC BY 4.0](LICENSE-CC-BY-4.0) for the standard (the schema definitions, naming conventions and documentation).
- [Apache-2.0](LICENSE-APACHE-2.0) for the code (the scripts, the dashboard and the build workflows).
- Both licenses for the machine-readable schema files, so that they remain available under either license at the adopter's option.

Everyone taking part follows the [Code of Conduct](CODE_OF_CONDUCT.md).

You represent that you have the right to license your contribution under those terms. Contributions keep the attribution in NOTICE intact.

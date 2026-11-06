# Contributing

The UDM improves through community input.

- **Suggest changes or report issues**: open a [GitHub Issue](https://github.com/ui-insight/AI4RA-UDM/issues) describing the table, column, or convention you would like to add, change, or discuss.
- **Join the discussion**: use [GitHub Discussions](https://github.com/ui-insight/AI4RA-UDM/discussions) for broader questions about the model's direction, new capability coverage, or adoption experiences.
- **Take the survey**: a short [practitioner survey](https://bit.ly/4b5b21q) on what your institution needs from a shared model.

## Making a change

A change to the standard edits `udm_schema.json`. The prose spec and the module vignettes are generated from it and sync-checked in CI, so edit the JSON and regenerate rather than editing the prose by hand. Run `scripts/validate_schema.py` and `scripts/check_spec_sync.py` before opening a pull request. When `udm_schema.json` changes on `main`, CI regenerates the dashboard data files served via GitHub Pages.

The glossary's source is `glossary.json`. Edit it, run `scripts/generate_glossary.py`, and run `scripts/check_glossary.py`, which confirms that each term's references exist in the schema and that every lifecycle status has a term. A schema change that renames a status fails this check until the glossary is updated. Definitions say what a thing is, without amounts, dates, or other details that change; point to the governing source for those. Cite a published source for any fact taken from a federal or sponsor rule.

A change to the standard must pass the conformance checker before a release may carry the AI4RA UDM name. See [NAME-POLICY.md](NAME-POLICY.md).

The version is set in the `VERSION` file. When it changes, update `metadata.version` in `udm_schema.json` and the current version line in `README.md` to match. `scripts/validate_schema.py` fails if they differ.

## License

By submitting a contribution you agree that it is licensed under the same terms as the part of the repository it changes, as set out in [NOTICE](NOTICE):

- [CC BY 4.0](LICENSE-CC-BY-4.0) for the standard (the schema definitions, naming conventions and documentation).
- [Apache-2.0](LICENSE-APACHE-2.0) for the code (the scripts, the dashboard and the build workflows).
- Both licenses for the machine-readable schema files, so that they remain available under either license at the adopter's option.

You represent that you have the right to license your contribution under those terms. Contributions keep the attribution in NOTICE intact.

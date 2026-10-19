# Contributing

The UDM improves through community input.

- **Suggest changes or report issues**: open a [GitHub Issue](https://github.com/ui-insight/AI4RA-UDM/issues) describing the table, column, or convention you would like to add, change, or discuss.
- **Join the discussion**: use [GitHub Discussions](https://github.com/ui-insight/AI4RA-UDM/discussions) for broader questions about the model's direction, new capability coverage, or adoption experiences.
- **Take the survey**: a short [practitioner survey](https://bit.ly/4b5b21q) on what your institution needs from a shared model.

## Making a change

A change to the standard edits `udm_schema_v2.json`. The prose spec and the module vignettes are generated from it and sync-checked in CI, so edit the JSON and regenerate rather than editing the prose by hand. Run `scripts/validate_schema.py` and `scripts/check_spec_sync.py` before opening a pull request. When `udm_schema_v2.json` changes on `main`, CI regenerates the dashboard data files served via GitHub Pages.

A change to the standard must pass the conformance checker before a release may carry the AI4RA UDM name. See [NAME-POLICY.md](NAME-POLICY.md).

## License

By submitting a contribution you agree that it is licensed under the same terms as the part of the repository it changes, as set out in [NOTICE](NOTICE):

- [CC BY 4.0](LICENSE-CC-BY-4.0) for the standard (the schema definitions, naming conventions and documentation).
- [Apache-2.0](LICENSE-APACHE-2.0) for the code (the scripts, the dashboard and the build workflows).
- Both licenses for the machine-readable schema files, so that they remain available under either license at the adopter's option.

You represent that you have the right to license your contribution under those terms. Contributions keep the attribution in NOTICE intact.

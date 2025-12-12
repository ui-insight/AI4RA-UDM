# Editable Dashboard TODO

## Goal
Make column descriptions in the data dictionary browser editable. When a user edits a description, commit the change to the `community-edits` branch on DoltHub via API.

## Prerequisites
- [x] Create `community-edits` branch in Dolt
- [ ] Create API token on DoltHub (https://www.dolthub.com/settings/tokens)
  - Token needs write access to `DataDictionary` table only
  - Token should be restricted to `community-edits` branch only (if DoltHub supports this)

## Configuration Files
- [x] Create `docs/config.template.js` (template without real token)
- [x] Create `docs/config.js` (actual config with token - gitignored)
- [x] Update `.gitignore` to exclude `docs/config.js`

## Implementation Tasks

### 1. Add Editing UI to `docs/index.html`
- [ ] Make description cells clickable (click to edit)
- [ ] Add textarea/contenteditable for edit mode
- [ ] Add Save and Cancel buttons
- [ ] Add loading/success/error states

### 2. Add DoltHub API Integration
- [ ] Implement `updateDoltHub(query)` function
  - POST to `https://www.dolthub.com/api/v1alpha1/n8layman/AI4RA-UDM/write/main/community-edits`
  - Include token in authorization header
  - Send UPDATE query in request body
- [ ] Implement operation polling (DoltHub write operations are async)
- [ ] Handle errors and show user-friendly messages

### 3. Add Input Validation (UX only, not security)
- [ ] HTML escape input to prevent XSS in UI
- [ ] SQL string escaping (single quotes)
- [ ] Block obvious SQL keywords (DROP, DELETE, etc.)
- [ ] Limit description length (5000 chars)
- [ ] Add 2-second cooldown between edits

### 4. Build UPDATE Query
- [ ] Format: `UPDATE DataDictionary SET Description = '...' WHERE Entity = '...' AND Parent_Entity = '...' AND Entity_Type = 'Column'`
- [ ] Only allow editing column descriptions (not table descriptions)

### 5. Testing
- [ ] Test end-to-end edit flow
- [ ] Try SQL injection patterns (should be blocked by validation)
- [ ] Test error scenarios (network failure, bad input)
- [ ] Verify commits appear in `community-edits` branch on DoltHub

### 6. Documentation
- [ ] Update `README.md` with token setup instructions
- [ ] Add inline help text in the UI
- [ ] Document the manual review/merge workflow

## Security Notes
- **Token will be public** in browser JavaScript (acceptable risk)
- **Real security** comes from DoltHub token scope limits
- **Client-side validation** is for UX only, can be bypassed
- **Manual review** required before merging `community-edits` → `main`
- **Audit trail** via Dolt commit history
- **Easy reversion** of bad edits

## Scope
- **Editable**: Only column descriptions (not tables, not synonyms)
- **Branch**: All edits go to `community-edits` (not `main`)
- **UI**: Click description text to edit (no hover icons)

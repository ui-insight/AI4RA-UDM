# UDM Dashboard TODO

## 1. DoltHub Setup & Configuration
- [ ] Create DoltHub account/organization if not already exists
- [ ] Create or verify DoltHub repository for AI4RA-UDM
- [ ] Configure DoltHub access credentials for GitHub Actions
- [ ] Set up DoltHub API access tokens
- [ ] Test DoltHub SQL API connection
- [ ] Document DoltHub connection parameters (host, database name, etc.)

## 2. GitHub Actions Workflow
- [ ] Create `.github/workflows/` directory structure
- [ ] Create workflow to pull schema from DoltHub
  - [ ] Query `INFORMATION_SCHEMA` for table/column metadata
  - [ ] Query `DataDictionary` table for descriptions
  - [ ] Query foreign key relationships for ERD
- [ ] Generate JSON output files:
  - [ ] `schema.json` - Current database schema structure
  - [ ] `data-dictionary.json` - Table and column descriptions
  - [ ] `relationships.json` - Foreign key relationships for ERD
- [ ] Configure workflow to run on:
  - [ ] Push to main branch
  - [ ] Manual trigger (workflow_dispatch)
  - [ ] Schedule (e.g., daily)
- [ ] Commit generated JSON files to repository
- [ ] Test workflow execution

## 3. Frontend Structure
- [ ] Create `docs/` directory for GitHub Pages
- [ ] Create `index.html` - Main single-page application
- [ ] Create `css/styles.css` - Styling for layout and components
- [ ] Create `js/app.js` - Main application logic
- [ ] Create `js/erd.js` - Cytoscape.js ERD visualization
- [ ] Create `js/dictionary.js` - Data Dictionary table logic
- [ ] Create `js/data-loader.js` - Load JSON data files

## 4. Data Dictionary Panel (Left)
- [ ] Implement editable HTML table for Data Dictionary
- [ ] Add columns: Table Name, Column Name, Data Type, Description, Constraints
- [ ] Implement inline editing functionality
- [ ] Add search/filter toolbar above table
- [ ] Implement validation for proposed changes
- [ ] Add "Save Proposal" button
- [ ] Implement proposal submission to DoltHub branch
  - [ ] Create new branch via DoltHub API
  - [ ] Commit changes to branch
  - [ ] Display confirmation message with branch name/PR link
- [ ] Add visual indicators for unsaved changes
- [ ] Implement table sorting by column
- [ ] Add expandable/collapsible table sections

## 5. ERD Panel (Right)
- [ ] Integrate Cytoscape.js library
- [ ] Parse `relationships.json` to build graph structure
- [ ] Render interactive ERD diagram
- [ ] Implement node styling:
  - [ ] Color-code tables by category (Reference, Core, Pre-Award, Post-Award, etc.)
  - [ ] Display table names clearly
  - [ ] Show primary keys
- [ ] Implement edge styling for relationships:
  - [ ] Different styles for 1:1, 1:N, N:M relationships
  - [ ] Arrow directions for foreign keys
- [ ] Add click interactions:
  - [ ] Click table to highlight and show details
  - [ ] Display foreign key relationships
  - [ ] Show connected tables
- [ ] Implement zoom and pan controls
- [ ] Add layout options (hierarchical, circular, force-directed)
- [ ] Add "Reset View" button
- [ ] Make ERD read-only (no editing)

## 6. Layout & Responsive Design
- [ ] Implement two-panel split layout (left: dictionary, right: ERD)
- [ ] Make layout responsive for different screen sizes
- [ ] Add resizable divider between panels
- [ ] Implement mobile-friendly view (stacked panels)
- [ ] Add header with project title and navigation
- [ ] Add footer with documentation links
- [ ] Implement clear messaging: "All changes are proposals for review"

## 7. GitHub Pages Deployment
- [ ] Enable GitHub Pages in repository settings
- [ ] Configure Pages to serve from `docs/` directory
- [ ] Test deployment to GitHub Pages
- [ ] Verify all static assets load correctly
- [ ] Configure custom domain (if desired)
- [ ] Add site URL to README.md

## 8. DoltHub Proposal Workflow
- [ ] Implement branch creation logic via DoltHub API
- [ ] Generate SQL statements for Data Dictionary updates
- [ ] Commit changes to DoltHub branch
- [ ] (Optional) Create pull request automatically via DoltHub API
- [ ] Add UI feedback for successful proposal submission
- [ ] Document proposal review process for maintainers
- [ ] Test end-to-end proposal workflow

## 9. Documentation
- [ ] Create `docs/README.md` with site overview
- [ ] Document how to propose Data Dictionary changes
- [ ] Document ERD navigation and features
- [ ] Create maintainer guide for reviewing proposals
- [ ] Document GitHub Actions workflow configuration
- [ ] Add troubleshooting guide
- [ ] Update main README.md with dashboard link and description

## 10. Testing & Quality Assurance
- [ ] Test Data Dictionary editing in multiple browsers
- [ ] Test ERD rendering with full schema
- [ ] Test proposal submission workflow
- [ ] Verify GitHub Actions workflow executes successfully
- [ ] Test responsive design on mobile devices
- [ ] Validate accessibility (WCAG compliance)
- [ ] Performance testing with large schema
- [ ] Cross-browser compatibility testing

## 11. Optional Enhancements
- [ ] Add user authentication for proposal submissions
- [ ] Implement proposal history/tracking
- [ ] Add data validation rules in Data Dictionary
- [ ] Export ERD as PNG/SVG
- [ ] Add dark mode toggle
- [ ] Implement keyboard shortcuts for navigation
- [ ] Add schema version comparison view
- [ ] Integrate with GitHub Issues for tracking proposals

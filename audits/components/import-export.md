# Import/Export Components Audit

## Component Category
- **Location**: `apps/web/src/components/import-export/`
- **Status**: ⏳ Pending Review

---

## Components

### 1. ExportDialog (`export-dialog.tsx`)
- **Purpose**: Export organization data to JSON
- **Features**: 
  - Options for what to include (posts, media, taxonomies, custom fields)
  - Direct fetch (not using apiClient) - line 56
  - File download

### 2. ImportDialog (`import-dialog.tsx`)
- **Purpose**: Import data from JSON file
- **Features**:
  - File validation
  - JSON structure validation
  - Import options (skip existing, import media, dry run)
  - Progress tracking

---

## Issues Identified

### ExportDialog
- Uses direct fetch instead of apiClient (line 56)
- **Missing**: Error handling for network failures

### ImportDialog
- File validation before upload
- JSON parsing validation
- Large file warnings

---

## E. Improvements Needed

### High Priority
- [ ] Use apiClient consistently in ExportDialog
- [ ] Better error handling

---

## Related Audits
- Related pages: `settings.md`
- Related API routes: `api-routes/admin/export.md`, `api-routes/admin/import.md`


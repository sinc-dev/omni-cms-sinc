# Master Audit Index

This document provides a complete catalog of all pages, routes, components, and user flows in the Omni-CMS project. Each item links to its detailed audit document.

**Last Updated**: 2025-01-27  
**Status**: In Progress - API Routes 100% Complete

---

## Audit Progress Summary

**Total Items**: ~150+
- ✅ Pages Audited: 30+ (out of 35) - 86%
- ✅ API Routes Audited: 61/61 - **100% COMPLETE**
  - Admin Routes: 49 files (50 audit docs)
  - Public Routes: 12 files (11 audit docs + auth-otp)
- ⏳ Components Audited: 28+ (out of 113) - 25%
- ⏳ User Flows Audited: 3 (out of 5) - 60%
- ✅ Technical Audits: 4/4 complete - 100%

**Overall Completion**: ~62%

---

## Frontend Pages

### Organization-Scoped Pages (`[orgId]/`)

| Page | Route | File | Status | Audit Document |
|------|-------|------|--------|----------------|
| Dashboard | `/:orgId/dashboard` | `apps/web/src/app/[orgId]/dashboard/page.tsx` | ✅ Improved | [dashboard.md](../pages/dashboard.md) |
| Posts List | `/:orgId/posts` | `apps/web/src/app/[orgId]/posts/page.tsx` | ⏳ Pending | [posts.md](../pages/posts.md) |
| Post Detail | `/:orgId/posts/[id]` | `apps/web/src/app/[orgId]/posts/[id]/page.tsx` | ⏳ Pending | [post-detail.md](../pages/post-detail.md) |
| Create Post | `/:orgId/posts/new` | `apps/web/src/app/[orgId]/posts/new/page.tsx` | ⏳ Pending | [post-new.md](../pages/post-new.md) |
| Media Library | `/:orgId/media` | `apps/web/src/app/[orgId]/media/page.tsx` | ⏳ Pending | [media.md](../pages/media.md) |
| Taxonomies | `/:orgId/taxonomies` | `apps/web/src/app/[orgId]/taxonomies/page.tsx` | ⏳ Pending | [taxonomies.md](../pages/taxonomies.md) |
| Post Types | `/:orgId/post-types` | `apps/web/src/app/[orgId]/post-types/page.tsx` | ⏳ Pending | [post-types.md](../pages/post-types.md) |
| Post Type Detail | `/:orgId/post-types/[id]` | `apps/web/src/app/[orgId]/post-types/[id]/page.tsx` | ⏳ Pending | [post-type-detail.md](../pages/post-type-detail.md) |
| Edit Post Type | `/:orgId/post-types/[id]/edit` | `apps/web/src/app/[orgId]/post-types/[id]/edit/page.tsx` | ⏳ Pending | [post-type-edit.md](../pages/post-type-edit.md) |
| Custom Fields | `/:orgId/custom-fields` | `apps/web/src/app/[orgId]/custom-fields/page.tsx` | ⏳ Pending | [custom-fields.md](../pages/custom-fields.md) |
| Content Blocks | `/:orgId/content-blocks` | `apps/web/src/app/[orgId]/content-blocks/page.tsx` | ⏳ Pending | [content-blocks.md](../pages/content-blocks.md) |
| Templates | `/:orgId/templates` | `apps/web/src/app/[orgId]/templates/page.tsx` | ⏳ Pending | [templates.md](../pages/templates.md) |
| Webhooks | `/:orgId/webhooks` | `apps/web/src/app/[orgId]/webhooks/page.tsx` | ⏳ Pending | [webhooks.md](../pages/webhooks.md) |
| API Keys | `/:orgId/api-keys` | `apps/web/src/app/[orgId]/api-keys/page.tsx` | ⏳ Pending | [api-keys.md](../pages/api-keys.md) |
| Users | `/:orgId/users` | `apps/web/src/app/[orgId]/users/page.tsx` | ⏳ Pending | [users.md](../pages/users.md) |
| Settings | `/:orgId/settings` | `apps/web/src/app/[orgId]/settings/page.tsx` | ⏳ Pending | [settings.md](../pages/settings.md) |
| Profile | `/:orgId/profile` | `apps/web/src/app/[orgId]/profile/page.tsx` | ⏳ Pending | [profile.md](../pages/profile.md) |
| Analytics | `/:orgId/analytics` | `apps/web/src/app/[orgId]/analytics/page.tsx` | ⏳ Pending | [analytics.md](../pages/analytics.md) |
| Search | `/:orgId/search` | `apps/web/src/app/[orgId]/search/page.tsx` | ⏳ Pending | [search.md](../pages/search.md) |
| Relationships | `/:orgId/relationships` | `apps/web/src/app/[orgId]/relationships/page.tsx` | ⏳ Pending | [relationships.md](../pages/relationships.md) |
| Models | `/:orgId/models` | `apps/web/src/app/[orgId]/models/page.tsx` | ⏳ Pending | [models.md](../pages/models.md) |
| Reviews | `/:orgId/reviews` | `apps/web/src/app/[orgId]/reviews/page.tsx` | ⏳ Pending | [reviews.md](../pages/reviews.md) |

### Public/Auth Pages

| Page | Route | File | Status | Audit Document |
|------|-------|------|--------|----------------|
| Root | `/` | `apps/web/src/app/page.tsx` | ✅ Improved | [root.md](../pages/root.md) |
| Sign In | `/sign-in` | `apps/web/src/app/sign-in/page.tsx` | ✅ Audited | [sign-in.md](../pages/sign-in.md) |
| Sign Up | `/sign-up` | `apps/web/src/app/sign-up/page.tsx` | ✅ Audited | [sign-up.md](../pages/sign-up.md) |
| Select Organization | `/select-organization` | `apps/web/src/app/select-organization/page.tsx` | ✅ Audited | [select-organization.md](../pages/select-organization.md) |
| Forbidden | `/forbidden` | `apps/web/src/app/forbidden/page.tsx` | ✅ Improved | [forbidden.md](../pages/forbidden.md) |
| Unauthorized | `/unauthorized` | `apps/web/src/app/unauthorized/page.tsx` | ⏳ Pending | [unauthorized.md](../pages/unauthorized.md) |
| Error Boundary | N/A | `apps/web/src/app/error.tsx` | ⏳ Pending | [error-boundary.md](../pages/error-boundary.md) |
| Not Found | N/A | `apps/web/src/app/not-found.tsx` | ⏳ Pending | [not-found.md](../pages/not-found.md) |

### Legacy/Admin Pages

| Page | Route | File | Status | Audit Document | Notes |
|------|-------|------|--------|----------------|-------|
| Admin Dashboard | `/admin` | `apps/web/src/app/admin/page.tsx` | ⚠️ Legacy? | [admin-dashboard.md](../pages/admin-dashboard.md) | May be duplicate |
| Admin Organizations | `/admin/organizations` | `apps/web/src/app/admin/organizations/page.tsx` | ⚠️ Duplicate? | [admin-organizations.md](../pages/admin-organizations.md) | Duplicate of organizations? |
| Organizations | `/organizations` | `apps/web/src/app/organizations/page.tsx` | ⚠️ Duplicate? | [organizations.md](../pages/organizations.md) | Duplicate of admin/organizations? |
| Content | `/content` | `apps/web/src/app/content/page.tsx` | ⏳ Pending | [content.md](../pages/content.md) | Purpose unclear |
| Settings | `/settings` | `apps/web/src/app/settings/page.tsx` | ⏳ Pending | [global-settings.md](../pages/global-settings.md) | Global settings? |

**Legend:**
- ✅ Completed/Improved
- ⏳ Pending Audit
- ⚠️ Needs Review (duplicate/legacy)

---

## API Routes

### Admin Routes (`/api/admin/v1/organizations`) - ✅ **ALL COMPLETE**

**49 route files → 50 audit documents**

| Route | File | Status | Audit Document |
|-------|------|--------|----------------|
| Organizations | `apps/api/src/routes/admin/organizations.ts` | ✅ Complete | [organizations.md](../api-routes/admin/organizations.md) |
| Posts | `apps/api/src/routes/admin/posts.ts` | ✅ Complete | [posts.md](../api-routes/admin/posts.md) |
| Post Detail | `apps/api/src/routes/admin/post-detail.ts` | ✅ Complete | [post-detail.md](../api-routes/admin/post-detail.md) |
| Media | `apps/api/src/routes/admin/media.ts` | ✅ Complete | [media.md](../api-routes/admin/media.md) |
| Media Detail | `apps/api/src/routes/admin/media-detail.ts` | ✅ Complete | [media-detail.md](../api-routes/admin/media-detail.md) |
| Taxonomies | `apps/api/src/routes/admin/taxonomies.ts` | ✅ Complete | [taxonomies.md](../api-routes/admin/taxonomies.md) |
| Taxonomy Detail | `apps/api/src/routes/admin/taxonomy-detail.ts` | ✅ Complete | [taxonomy-detail.md](../api-routes/admin/taxonomy-detail.md) |
| Taxonomy Terms | `apps/api/src/routes/admin/taxonomy-terms.ts` | ✅ Complete | [taxonomy-terms.md](../api-routes/admin/taxonomy-terms.md) |
| Taxonomy Term Detail | `apps/api/src/routes/admin/taxonomy-term-detail.ts` | ✅ Complete | [taxonomy-term-detail.md](../api-routes/admin/taxonomy-term-detail.md) |
| Post Types | `apps/api/src/routes/admin/post-types.ts` | ✅ Complete | [post-types.md](../api-routes/admin/post-types.md) |
| Post Type Detail | `apps/api/src/routes/admin/post-type-detail.ts` | ✅ Complete | [post-type-detail.md](../api-routes/admin/post-type-detail.md) |
| Post Type Fields | `apps/api/src/routes/admin/post-type-fields.ts` | ✅ Complete | [post-type-fields.md](../api-routes/admin/post-type-fields.md) |
| Custom Fields | `apps/api/src/routes/admin/custom-fields.ts` | ✅ Complete | [custom-fields.md](../api-routes/admin/custom-fields.md) |
| Custom Field Detail | `apps/api/src/routes/admin/custom-field-detail.ts` | ✅ Complete | [custom-field-detail.md](../api-routes/admin/custom-field-detail.md) |
| Content Blocks | `apps/api/src/routes/admin/content-blocks.ts` | ✅ Complete | [content-blocks.md](../api-routes/admin/content-blocks.md) |
| Content Block Detail | `apps/api/src/routes/admin/content-block-detail.ts` | ✅ Complete | [content-block-detail.md](../api-routes/admin/content-block-detail.md) |
| Templates | `apps/api/src/routes/admin/templates.ts` | ✅ Complete | [templates.md](../api-routes/admin/templates.md) |
| Template Detail | `apps/api/src/routes/admin/template-detail.ts` | ✅ Complete | [template-detail.md](../api-routes/admin/template-detail.md) |
| Webhooks | `apps/api/src/routes/admin/webhooks.ts` | ✅ Complete | [webhooks.md](../api-routes/admin/webhooks.md) |
| Webhook Detail | `apps/api/src/routes/admin/webhook-detail.ts` | ✅ Complete | [webhook-detail.md](../api-routes/admin/webhook-detail.md) |
| Webhook Test | `apps/api/src/routes/admin/webhook-test.ts` | ✅ Complete | [webhook-test.md](../api-routes/admin/webhook-test.md) |
| Webhook Logs | `apps/api/src/routes/admin/webhook-logs.ts` | ✅ Complete | [webhook-logs.md](../api-routes/admin/webhook-logs.md) |
| API Keys | `apps/api/src/routes/admin/api-keys.ts` | ✅ Complete | [api-keys.md](../api-routes/admin/api-keys.md) |
| API Key Detail | `apps/api/src/routes/admin/api-key-detail.ts` | ✅ Complete | [api-key-detail.md](../api-routes/admin/api-key-detail.md) |
| API Key Rotate | `apps/api/src/routes/admin/api-key-rotate.ts` | ✅ Complete | [api-key-rotate.md](../api-routes/admin/api-key-rotate.md) |
| Users | `apps/api/src/routes/admin/users.ts` | ✅ Complete | [users.md](../api-routes/admin/users.md) |
| User Detail | `apps/api/src/routes/admin/user-detail.ts` | ✅ Complete | [user-detail.md](../api-routes/admin/user-detail.md) |
| Profile | `apps/api/src/routes/admin/profile.ts` | ✅ Complete | [profile.md](../api-routes/admin/profile.md) |
| Roles | `apps/api/src/routes/admin/roles.ts` | ✅ Complete | [roles.md](../api-routes/admin/roles.md) |
| Search | `apps/api/src/routes/admin/search.ts` | ✅ Complete | [search.md](../api-routes/admin/search.md) |
| Analytics | `apps/api/src/routes/admin/analytics.ts` | ✅ Complete | [analytics.md](../api-routes/admin/analytics.md) |
| Analytics Posts | `apps/api/src/routes/admin/analytics-posts.ts` | ✅ Complete | [analytics-posts.md](../api-routes/admin/analytics-posts.md) |
| Import | `apps/api/src/routes/admin/import.ts` | ✅ Complete | [import.md](../api-routes/admin/import.md) |
| Export | `apps/api/src/routes/admin/export.ts` | ✅ Complete | [export.md](../api-routes/admin/export.md) |
| Schema | `apps/api/src/routes/admin/schema.ts` | ✅ Complete | [schema.md](../api-routes/admin/schema.md) |
| Schema Object Type | `apps/api/src/routes/admin/schema-object-type.ts` | ✅ Complete | [schema-object-type.md](../api-routes/admin/schema-object-type.md) |
| Schema Post Types | `apps/api/src/routes/admin/schema-post-types.ts` | ✅ Complete | [schema-post-types.md](../api-routes/admin/schema-post-types.md) |
| Schema Database | `apps/api/src/routes/admin/schema-database.ts` | ✅ Complete | [schema-database.md](../api-routes/admin/schema-database.md) |
| GraphQL | `apps/api/src/routes/admin/graphql.ts` | ✅ Complete | [graphql.md](../api-routes/admin/graphql.md) |
| AI | `apps/api/src/routes/admin/ai.ts` | ✅ Complete | [ai.md](../api-routes/admin/ai.md) |
| Post Versions | `apps/api/src/routes/admin/post-versions.ts` | ✅ Complete | [post-versions.md](../api-routes/admin/post-versions.md) |
| Post Version Restore | `apps/api/src/routes/admin/post-version-restore.ts` | ✅ Complete | [post-version-restore.md](../api-routes/admin/post-version-restore.md) |
| Post Publish | `apps/api/src/routes/admin/post-publish.ts` | ✅ Complete | [post-publish.md](../api-routes/admin/post-publish.md) |
| Post Lock | `apps/api/src/routes/admin/post-lock.ts` | ✅ Complete | [post-lock.md](../api-routes/admin/post-lock.md) |
| Post Presence | `apps/api/src/routes/admin/post-presence.ts` | ✅ Complete | [post-presence.md](../api-routes/admin/post-presence.md) |
| Post Workflow | `apps/api/src/routes/admin/post-workflow.ts` | ✅ Complete | [post-workflow.md](../api-routes/admin/post-workflow.md) |
| Post From Template | `apps/api/src/routes/admin/post-from-template.ts` | ✅ Complete | [post-from-template.md](../api-routes/admin/post-from-template.md) |
| Post Relationships | `apps/api/src/routes/admin/post-relationships.ts` | ✅ Complete | [post-relationships.md](../api-routes/admin/post-relationships.md) |
| Posts Pending Review | `apps/api/src/routes/admin/posts-pending-review.ts` | ✅ Complete | [posts-pending-review.md](../api-routes/admin/posts-pending-review.md) |

### Public Routes (`/api/public/v1`) - ✅ **ALL COMPLETE**

**12 route files → 11 audit documents (+ auth-otp audited separately)**

| Route | File | Status | Audit Document |
|-------|------|--------|----------------|
| Posts | `apps/api/src/routes/public/posts.ts` | ✅ Complete | [posts.md](../api-routes/public/posts.md) |
| Post Detail | `apps/api/src/routes/public/post-detail.ts` | ✅ Complete | [post-detail.md](../api-routes/public/post-detail.md) |
| Post Share | `apps/api/src/routes/public/post-share.ts` | ✅ Complete | [post-share.md](../api-routes/public/post-share.md) |
| Post SEO | `apps/api/src/routes/public/post-seo.ts` | ✅ Complete | [post-seo.md](../api-routes/public/post-seo.md) |
| Media | `apps/api/src/routes/public/media.ts` | ✅ Complete | [media.md](../api-routes/public/media.md) |
| Search | `apps/api/src/routes/public/search.ts` | ✅ Complete | [search.md](../api-routes/public/search.md) |
| Taxonomies | `apps/api/src/routes/public/taxonomies.ts` | ✅ Complete | [taxonomies.md](../api-routes/public/taxonomies.md) |
| Taxonomy Term Posts | `apps/api/src/routes/public/taxonomy-term-posts.ts` | ✅ Complete | [taxonomy-term-posts.md](../api-routes/public/taxonomy-term-posts.md) |
| Sitemap | `apps/api/src/routes/public/sitemap.ts` | ✅ Complete | [sitemap.md](../api-routes/public/sitemap.md) |
| Analytics Track | `apps/api/src/routes/public/analytics-track.ts` | ✅ Complete | [analytics-track.md](../api-routes/public/analytics-track.md) |
| MCP Documentation | `apps/api/src/routes/public/mcp.ts` | ✅ Complete | [mcp.md](../api-routes/public/mcp.md) |
| OTP Auth | `apps/api/src/routes/public/auth-otp.ts` | ✅ Audited | (Audited in authentication audit) |

---

## Components

### Forms & Inputs
- Form Components (`apps/web/src/components/form-wrappers/`) - ⏳ Pending
- Input Components (`apps/web/src/components/ui/input.tsx`, etc.) - ⏳ Pending

### Navigation
- Header (`apps/web/src/components/layout/header.tsx`) - ⏳ Pending
- Sidebar (`apps/web/src/components/layout/app-sidebar.tsx`) - ⏳ Pending
- Mobile Menu (`apps/web/src/components/navigation/mobile-menu.tsx`) - ⏳ Pending
- Breadcrumbs (`apps/web/src/components/breadcrumbs/breadcrumbs.tsx`) - ⏳ Pending

### Data Display
- Tables (`apps/web/src/components/ui/table.tsx`) - ⏳ Pending
- Cards (`apps/web/src/components/ui/card.tsx`) - ⏳ Pending
- Filters (`apps/web/src/components/filters/`) - ⏳ Pending
- Pagination (`apps/web/src/components/ui/pagination.tsx`) - ⏳ Pending

### Modals & Dialogs
- Dialog (`apps/web/src/components/ui/dialog.tsx`) - ⏳ Pending
- Alert Dialog (`apps/web/src/components/ui/alert-dialog.tsx`) - ⏳ Pending

### Feedback
- Toast (`apps/web/src/components/ui/sonner.tsx`) - ⏳ Pending
- Loading States (`apps/web/src/components/loading/`) - ⏳ Pending
- Error Components (`apps/web/src/components/errors/`) - ⏳ Pending

### Editor Components
- TipTap Editor (`apps/web/src/components/editor/tiptap-editor.tsx`) - ⏳ Pending
- Media Picker (`apps/web/src/components/editor/media-picker.tsx`) - ⏳ Pending
- Taxonomy Selector (`apps/web/src/components/editor/taxonomy-selector.tsx`) - ⏳ Pending

---

## User Flows

| Flow | Status | Audit Document |
|------|--------|----------------|
| Content Management | ⏳ Pending | [content-management.md](../flows/content-management.md) |
| Media Management | ⏳ Pending | [media-management.md](../flows/media-management.md) |
| User Management | ⏳ Pending | [user-management.md](../flows/user-management.md) |
| Organization Management | ⏳ Pending | [organization-management.md](../flows/organization-management.md) |
| Configuration | ⏳ Pending | [configuration.md](../flows/configuration.md) |

---

## Technical Audits

| Area | Status | Audit Document |
|------|--------|----------------|
| Performance | ⏳ Pending | [performance.md](../technical/performance.md) |
| Error Handling | ⏳ Pending | [error-handling.md](../technical/error-handling.md) |
| Code Patterns | ⏳ Pending | [code-patterns.md](../technical/code-patterns.md) |
| Security | ⏳ Pending | [security.md](../technical/security.md) |
| Technical Debt | ⏳ Pending | [DEBT.md](../technical/DEBT.md) |

---

## Summary Documents

- [Priorities](PRIORITIES.md) - Prioritized improvement list
- [Roadmap](ROADMAP.md) - Implementation roadmap
- [Technical Debt](../technical/DEBT.md) - Code quality and architecture issues

---

## Audit Progress

**Total Items**: ~150+
- ✅ Completed: 5
- ⏳ Pending: ~145
- ⚠️ Needs Review: 3

**Completion**: ~3%

---

## Notes

- Pages marked with ⚠️ need review to determine if they're duplicates or legacy code
- Some routes may not have corresponding frontend pages
- Component audits will be grouped by category
- User flows will document end-to-end experiences


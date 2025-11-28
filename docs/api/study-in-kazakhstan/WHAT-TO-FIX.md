# What Needs to Be Fixed - Summary

## Organizations Affected

This fix applies to **all three organizations**:
1. **study-in-kazakhstan**
2. **study-in-north-cyprus**
3. **paris-american-international-university**

## Current Status

You ran the import scripts days ago. Here's what's working and what's not:

### ✅ What's Working:
- Post types created (for all organizations)
- Custom fields created (for all organizations)
- Posts imported with custom field values (for all organizations)
- Data exists in database

### ❌ What's Missing:
- **Custom fields are NOT attached to post types** (for all organizations)
- This causes API to return `customFields: {}` (empty) for all organizations

## The Problem

The original import process had a missing step:
1. ✅ Created custom fields (`custom_fields` table)
2. ✅ Created post field values (`post_field_values` table)
3. ❌ **MISSING:** Attach fields to post types (`post_type_fields` table)

The API filters custom fields by what's attached to the post type. Since nothing is attached, it returns empty `customFields: {}`.

## The Fix

### Option 1: SQL for ALL Organizations (Recommended - Use This!)

**File:** `FIX-ALL-ORGANIZATIONS.sql`

**Why SQL:**
- ✅ Works directly with existing database
- ✅ No need for transformed JSON files
- ✅ No need for mapping files
- ✅ Faster and simpler
- ✅ Safe to run multiple times
- ✅ Fixes all three organizations at once

**Steps:**
1. Run `FIX-ALL-ORGANIZATIONS.sql` Step 1 (check current state)
2. Run `FIX-ALL-ORGANIZATIONS.sql` Step 2 (fix all organizations)
3. Run `FIX-ALL-ORGANIZATIONS.sql` Step 3 (verify fix worked)
4. Test API - customFields should now appear for all organizations

**Time:** ~1 minute for all organizations

### Option 2: SQL for One Organization

**File:** `FIX-EXISTING-DATA.sql` (for study-in-kazakhstan only)

Use this if you want to fix one organization at a time.

### Option 3: JavaScript Script (Not Recommended for Existing Data)

**File:** `data-migration/scripts/attach-custom-fields-to-post-types.js`

**Why NOT recommended:**
- ❌ Requires transformed JSON files to exist
- ❌ Requires mapping files to exist
- ❌ More complex setup
- ❌ Slower (API calls)

**Only use if:**
- You still have the transformed data files
- You want to use the API approach
- You're doing a new import

## What Gets Fixed

### Before:
```sql
-- Query result:
post_type_slug | attached_fields | posts_with_values
universities   | 0               | 114
programs       | 0               | 5102
```

### After:
```sql
-- Query result:
post_type_slug | attached_fields | posts_with_values
universities   | 6+              | 114
programs       | 10+             | 5102
```

## Action Plan

### Step 1: Run SQL Fix for ALL Organizations (2 minutes)

1. Open D1 database console
2. Open `FIX-ALL-ORGANIZATIONS.sql`
3. Run Step 1 (check current state for all organizations)
4. Run Step 2 (fix all organizations at once)
5. Run Step 3 (verify fix worked)
6. Run Step 4 (see summary of attached fields)

### Step 2: Test API for All Organizations (3 minutes)

```bash
# Test Study in Kazakhstan
curl "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/posts/coventry-university-kazakhstan" \
  -H "Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7"

# Test Study in North Cyprus (if you have test posts)
curl "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-north-cyprus/posts/{post-slug}" \
  -H "Authorization: Bearer {api-key}"

# Test Paris American (if you have test posts)
curl "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/paris-american-international-university/posts/{post-slug}" \
  -H "Authorization: Bearer {api-key}"
```

**Expected:** `customFields` should now contain field values instead of `{}` for all organizations

### Step 3: Verify (2 minutes)

Check a few posts from each organization to make sure custom fields appear:
- **Study in Kazakhstan:** Universities should have `location`, `website`, `logo`, etc. Programs should have `tuition_fee`, `duration`, `language`, etc.
- **Study in North Cyprus:** Similar fields as Kazakhstan
- **Paris American:** Programs, team-members, academic-staff should have their respective custom fields

## Summary

**What to do:** Run `FIX-ALL-ORGANIZATIONS.sql` in D1 (Step 2)

**Time needed:** ~2 minutes for all three organizations

**Result:** Custom fields will appear in API responses for all organizations

**Organizations fixed:**
- ✅ study-in-kazakhstan
- ✅ study-in-north-cyprus
- ✅ paris-american-international-university

**No need to:**
- ❌ Re-import data
- ❌ Run JavaScript scripts
- ❌ Touch transformed files
- ❌ Re-run any import steps
- ❌ Fix organizations one at a time

Just run the SQL script once and all organizations are fixed!


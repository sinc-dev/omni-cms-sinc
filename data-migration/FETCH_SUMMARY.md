# Data Fetch Summary

## Study In Kazakhstan ✅

Successfully fetched all data from `https://studyinkzk.com`:

### WordPress Blog Posts
- **blogs** (`wp/v2/posts`): **21 items**

### JetEngine Custom Post Types
- **video-testimonials** (`wp/v2/video-testimonials`): **6 items**
- **team-members** (`wp/v2/team-members`): **14 items**
- **reviews** (`wp/v2/reviews`): **129 items**
- **programs** (`wp/v2/programs`): **5,102 items** ⚠️ Large dataset
- **price_lists_hs** (`wp/v2/price_lists_hs`): **0 items** (Country Based Scholarships)
- **universities** (`wp/v2/universities`): **114 items**
- **jobs** (`wp/v2/jobs`): **0 items**
- **dormitories** (`wp/v2/dormitories`): **0 items**
- **programs_** (`wp/v2/programs_`): **765 items** (Old Programs)
- **universities_** (`wp/v2/universities_`): **7 items** (Old Universities)

### Taxonomies
- **categories**: **13 items**
- **tags**: **112 items**

### Authors
- **authors** (`wp/v2/users`): **25 items**

### Total Items Fetched
- **Total**: ~6,200+ items
- **Data Location**: `organizations/study-in-kazakhstan/raw-data/`

---

## Study in North Cyprus ✅

**Status**: Successfully fetched all data! **Fixed on 2025-11-24**

**Solution**: Used username `scrape-assist2` instead of `scrape-assist`

### Successfully Fetched

**WordPress Blog Posts**:
- **blogs** (`wp/v2/posts`): **113 items** ✅

**JetEngine Custom Post Types**:
- **dormitories** (`wp/v2/dormitories`): **24 items** ✅
- **video-testimonials** (`wp/v2/video-testimonials`): **9 items** ✅
- **team-members** (`wp/v2/team-members`): **14 items** ✅
- **reviews** (`wp/v2/reviews`): **129 items** ✅
- **programs** (`wp/v2/programs`): **967 items** ✅
- **price_lists_hs** (`wp/v2/price_lists_hs`): **0 items** (Country Based Scholarships)
- **universities** (`wp/v2/universities`): **13 items** ✅

**Taxonomies**:
- **categories**: **13 items** ✅
- **tags**: **115 items** ✅

**Authors**:
- **authors** (`wp/v2/users`): **13 items** ✅

### Total Items Fetched
- **Total**: ~1,300+ items
- **Data Location**: `organizations/study-in-north-cyprus/raw-data/`

### Authentication Details
- **Username**: `scrape-assist2`
- **Password**: Same as other sites (`X@$T06nzmZM%Xyz%l5p3IHSf`)
- **Note**: Different username required compared to Study In Kazakhstan (`scrape-assist`) and Paris American (`scrape-assist3`)

---

## Paris American International University ✅

**Status**: Successfully fetched all data!

**Base URL**: `https://parisamerican.org`
**Username**: `scrape-assist3`

### Successfully Fetched
- **blogs** (`wp/v2/posts`): **46 items** ✅
- **academic-staff** (`wp/v2/academic-staff`): **10 items** ✅
- **team-members** (`wp/v2/team-members`): **4 items** ✅
- **instructors** (`wp/v2/instructors`): **14 items** ✅
- **programs** (`wp/v2/programs`): **45 items** ✅
- **categories**: **12 items** ✅
- **tags**: **114 items** ✅
- **authors**: **8 items** ✅

### Total Items Fetched
- **Total**: ~139 items
- **Data Location**: `organizations/paris-american-international-university/raw-data/`

---

## Next Steps

1. ✅ **Study In Kazakhstan**: Data fetched successfully (~6,200+ items)
2. ✅ **Study in North Cyprus**: Data fetched successfully (~1,300+ items) - **Fixed 2025-11-24**
3. ✅ **Paris American International University**: All data fetched successfully (~139 items)

## Data Files

All fetched data is saved in:
```
organizations/
  study-in-kazakhstan/
    raw-data/
      blogs/raw.json
      video-testimonials/raw.json
      team-members/raw.json
      reviews/raw.json
      programs/raw.json (5102 items!)
      price_lists_hs/raw.json
      universities/raw.json
      jobs/raw.json
      dormitories/raw.json
      programs_/raw.json (765 items)
      universities_/raw.json
      taxonomies.json
      authors.json
      fetch-summary.json
```

## Notes

- **Programs**: Study In Kazakhstan has 5,102 active programs + 765 old programs = **5,867 total programs**
- **Old Post Types**: `programs_` and `universities_` are legacy post types that may need special handling
- **Empty Post Types**: Some post types have 0 items (jobs, dormitories, price_lists_hs) - this is normal
- **Progress Tracking**: Large datasets show progress every 10 pages or 1000 items


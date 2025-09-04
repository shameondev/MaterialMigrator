# Using MaterialMigrator in Your Project

This guide shows how to integrate MaterialMigrator into your existing React projects.

## Installation Options

### Option 1: Use via npx (Recommended)
Run directly without installation:
```bash
npx material-migrator migrate --pattern "src/**/*.tsx" --dry-run
```

### Option 2: Global Installation
Install globally for repeated use:
```bash
npm install -g material-migrator
material-migrator migrate --pattern "src/**/*.tsx" --dry-run
```

### Option 3: Local Development
Clone and link for development:
```bash
git clone https://github.com/shameondev/MaterialMigrator.git
cd MaterialMigrator
npm install
npm run build
npm link

# In your project directory:
npm link material-migrator
```

## Usage in dash-app

### 1. Test Migration (Dry Run)
Preview changes without modifying files:
```bash
npx material-migrator migrate \
  --pattern "src/components/**/*.tsx" \
  --pattern "src/views/**/*.tsx" \
  --exclude "**/*.test.tsx" \
  --exclude "**/stories/**" \
  --dry-run \
  --verbose
```

### 2. Test Specific Files
Test on individual files first:
```bash
npx material-migrator test src/components/Modal/index.tsx
```

### 3. Migrate by Feature
Migrate incrementally by feature/directory:
```bash
# Migrate components first
npx material-migrator migrate --pattern "src/components/**/*.tsx" --preserve-original

# Then views
npx material-migrator migrate --pattern "src/views/ABTesting/**/*.tsx" --preserve-original

# Finally specific files
npx material-migrator migrate --pattern "src/views/Products/CreateEditCopyProduct/index.tsx"
```

### 4. Generate Migration Report
Get detailed statistics and recommendations:
```bash
npx material-migrator migrate \
  --pattern "src/**/*.tsx" \
  --generate-report \
  --dry-run
```

This creates `migration-report.json` with:
- Conversion statistics per file
- List of unconvertible styles requiring manual review
- Warnings and recommendations

### 5. Full Production Migration
After testing, run full migration:
```bash
npx material-migrator migrate \
  --pattern "src/**/*.{ts,tsx}" \
  --exclude "node_modules/**" \
  --exclude "dist/**" \
  --exclude "**/*.test.tsx" \
  --preserve-original \
  --generate-report
```

## dash-app Specific Configuration

### Recommended Migration Strategy for dash-app:

1. **Phase 1: Components**
   ```bash
   npx material-migrator migrate --pattern "src/components/**/*.tsx" --preserve-original
   ```

2. **Phase 2: Views by Feature**
   ```bash
   npx material-migrator migrate --pattern "src/views/ABTesting/**/*.tsx" --preserve-original
   npx material-migrator migrate --pattern "src/views/Entitlements/**/*.tsx" --preserve-original
   npx material-migrator migrate --pattern "src/views/Monitoring/**/*.tsx" --preserve-original
   # ... continue for each view directory
   ```

3. **Phase 3: Remaining Files**
   ```bash
   npx material-migrator migrate --pattern "src/**/*.tsx" --exclude "src/components/**" --exclude "src/views/**"
   ```

### Custom Theme Mapping (if needed)
If your theme uses custom properties, create a config:

```javascript
// migration.config.js
export default {
  customThemeMapping: {
    'theme.custom.primaryColor': 'text-blue-600',
    'theme.custom.spacing.large': 'p-8',
  },
  customPropertyMapping: {
    'boxShadow': (value) => `shadow-custom-${value}`,
  }
};
```

## Post-Migration Steps

After running MaterialMigrator:

1. **Review Unconvertible Styles**
   - Check `migration-report.json` for styles requiring manual conversion
   - Focus on keyframes, complex selectors, and CSS animations

2. **Test Your Application**
   ```bash
   npm run dev
   npm run test
   ```

3. **Update Dependencies** (if needed)
   ```bash
   # Remove Material-UI if fully migrated
   npm uninstall @material-ui/core @material-ui/styles
   
   # Ensure Tailwind is properly configured
   npm install -D tailwindcss@latest
   ```

4. **Clean Up**
   ```bash
   # Remove backup files once verified
   find . -name "*.backup" -delete
   
   # Remove migration report
   rm migration-report.json
   ```

## Troubleshooting

### Common Issues:

**Issue**: Import errors after migration
**Solution**: Check that Tailwind CSS is properly configured in your project

**Issue**: Styles not applying correctly
**Solution**: Verify Tailwind classes are included in your build process

**Issue**: Complex animations not working
**Solution**: These require manual conversion - check the migration report for specific guidance

### Getting Help:

- Check the [GitHub Issues](https://github.com/shameondev/MaterialMigrator/issues)
- Review the migration report for specific guidance
- Test with `--dry-run` first to preview changes

## Example: Migrating dash-app Modal Component

```bash
# 1. Test the Modal component
npx material-migrator test src/components/Modal/index.tsx

# 2. Run migration with backup
npx material-migrator migrate --pattern "src/components/Modal/index.tsx" --preserve-original

# 3. Verify the results
git diff src/components/Modal/index.tsx

# 4. Test in browser
npm run dev
```

This approach ensures safe, incremental migration of your entire dash-app codebase!
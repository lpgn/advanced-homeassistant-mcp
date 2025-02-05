# Deployment Guide

This documentation is automatically deployed to GitHub Pages using GitHub Actions. Here's how it works and how to manage deployments.

## Automatic Deployment

The documentation is automatically deployed when changes are pushed to the `main` or `master` branch. The deployment process:

1. Triggers on push to main/master
2. Sets up Python environment
3. Installs required dependencies
4. Builds the documentation
5. Deploys to the `gh-pages` branch

### GitHub Actions Workflow

The deployment is handled by the workflow in `.github/workflows/deploy-docs.yml`. This is the single source of truth for documentation deployment:

```yaml
name: Deploy MkDocs
on:
  push:
    branches:
      - main
      - master
  workflow_dispatch:  # Allow manual trigger
```

## Manual Deployment

If needed, you can deploy manually using:

```bash
# Create a virtual environment
python -m venv venv

# Activate the virtual environment
source venv/bin/activate

# Install dependencies
pip install -r docs/requirements.txt

# Build the documentation
mkdocs build

# Deploy to GitHub Pages
mkdocs gh-deploy --force
```

## Best Practices

### 1. Documentation Updates
- Test locally before pushing: `mkdocs serve`
- Verify all links work
- Ensure images are optimized
- Check mobile responsiveness

### 2. Version Control
- Keep documentation in sync with code versions
- Use meaningful commit messages
- Tag important documentation versions

### 3. Content Guidelines
- Use consistent formatting
- Keep navigation structure logical
- Include examples where appropriate
- Maintain up-to-date screenshots

### 4. Maintenance
- Regularly review and update content
- Check for broken links
- Update dependencies
- Monitor GitHub Actions logs

## Troubleshooting

### Common Issues

1. **Failed Deployments**
   - Check GitHub Actions logs
   - Verify dependencies are up to date
   - Ensure all required files exist

2. **Broken Links**
   - Run `mkdocs build --strict`
   - Use relative paths in markdown
   - Check case sensitivity

3. **Style Issues**
   - Verify theme configuration
   - Check CSS customizations
   - Test on multiple browsers

## Configuration Files

### requirements.txt

Create a requirements file for documentation dependencies:

```txt
mkdocs-material
mkdocs-minify-plugin
mkdocs-git-revision-date-plugin
mkdocs-mkdocstrings
mkdocs-social-plugin
mkdocs-redirects
```

## Monitoring

- Check [GitHub Pages settings](https://github.com/jango-blockchained/advanced-homeassistant-mcp/settings/pages)
- Monitor build status in Actions tab
- Verify site accessibility 

## Workflow Features

### Caching
The workflow implements caching for Python dependencies to speed up deployments:
- Pip cache for Python packages
- MkDocs dependencies cache

### Deployment Checks
Several checks are performed during deployment:
1. Link validation with `mkdocs build --strict`
2. Build verification
3. Post-deployment site accessibility check

### Manual Triggers
You can manually trigger deployments using the "workflow_dispatch" event in GitHub Actions.

## Cleanup

To clean up duplicate workflow files, run:

```bash
# Make the script executable
chmod +x scripts/cleanup-workflows.sh

# Run the cleanup script
./scripts/cleanup-workflows.sh
``` 
# Planning Document System

This directory contains the markdown-based planning and documentation system for Lax DB.

## Files

- **`planning.md`** - Main project planning document with roadmap, status, and development guidelines
- **`README.md`** - This documentation file

## How to Update the Planning Document

### Option 1: Direct Edit
1. Edit `packages/web/src/content/planning.md` directly
2. The homepage will automatically reflect changes on refresh

### Option 2: Using Helpers (Recommended)
```typescript
import { updateLastModified } from '../utils/markdown-helpers';

// Update the last modified date
const updatedContent = updateLastModified(planningContent);
```

## Markdown Features Supported

The planning document supports all standard Markdown features:

- **Headers**: `# ## ###` for different heading levels
- **Lists**: Both ordered (`1. 2. 3.`) and unordered (`- * +`)
- **Task Lists**: `[ ]` for pending, `[x]` for completed tasks
- **Links**: `[text](url)` for external references
- **Code**: `inline code` and code blocks
- **Emphasis**: `*italic*` and `**bold**`
- **Blockquotes**: `>` for important notes
- **Horizontal Rules**: `---` for section breaks

## Typography Styling

The document uses Tailwind Typography plugin with custom styling:

- **Dark/Light Mode**: Automatic theme switching
- **Custom Colors**: Uses your design system colors
- **Responsive**: Optimized for different screen sizes
- **Accessibility**: High contrast and readable fonts

## Best Practices

### Content Organization
- Use H1 for main sections
- Use H2 for subsections
- Use H3 for detailed topics
- Keep task lists updated regularly

### Task Management
- Use `[ ]` for pending tasks
- Use `[x]` for completed tasks
- Group related tasks together
- Add due dates when relevant

### Maintenance
- Update the "Last updated" date when making changes
- Keep the status sections current
- Archive completed phases to separate documents
- Review and update the roadmap quarterly

## Integration

The planning document is automatically:
- Rendered on the homepage (`/`)
- Styled with your design system
- Updated with real-time timestamps
- Responsive across all devices

## Customization

To customize the appearance, modify the component styles in:
`packages/web/src/routes/index.tsx`

To add new markdown features, update the `ReactMarkdown` components configuration.
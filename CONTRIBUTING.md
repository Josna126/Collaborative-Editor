# Contributing to Collaborative Editor

Thanks for your interest in improving this project! This was built as a weekend challenge, but contributions are welcome.

## Development Setup

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/collab-editor.git`
3. Install dependencies: `npm install`
4. Set up `.env.local` with your Supabase credentials
5. Run the dev server: `npm run dev`

## Project Structure

```
collab-editor/
├── app/                    # Next.js app router pages
│   ├── page.tsx           # Home page
│   └── doc/[id]/          # Document editor page
├── components/            # React components
│   └── Editor.tsx         # Main editor component
├── lib/                   # Utilities and clients
│   └── supabase.ts        # Supabase client
├── server.js              # Custom Node.js + Socket.io server
└── ARCHITECTURE.md        # System architecture docs
```

## Making Changes

### Before You Start
- Check existing issues to avoid duplicate work
- For major changes, open an issue first to discuss
- Keep changes focused and atomic

### Code Style
- Use TypeScript for type safety
- Follow existing code formatting
- Use meaningful variable names
- Add comments for complex logic

### Testing Your Changes
1. Test locally with `npm run dev`
2. Open multiple browser windows to test collaboration
3. Test these scenarios:
   - Multiple users editing simultaneously
   - User disconnecting and reconnecting
   - Document persistence (close and reopen)
   - Typing indicators
   - User presence (avatars)

## Areas for Improvement

### High Priority
- [ ] Implement proper CRDT (Yjs integration)
- [ ] Add authentication (Supabase Auth)
- [ ] Improve error handling
- [ ] Add offline mode with sync queue
- [ ] Implement rate limiting

### Medium Priority
- [ ] Rich text toolbar (bold, italic, headings)
- [ ] Version history
- [ ] Real-time cursor positions
- [ ] Document permissions
- [ ] Export to Markdown/PDF

### Low Priority
- [ ] Comments and suggestions
- [ ] Document search
- [ ] Mobile app
- [ ] Dark mode
- [ ] Keyboard shortcuts

## Pull Request Process

1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Make your changes
3. Test thoroughly (see Testing section above)
4. Commit with clear messages: `git commit -m "Add: feature description"`
5. Push to your fork: `git push origin feature/your-feature-name`
6. Open a Pull Request with:
   - Clear description of changes
   - Screenshots/GIFs if UI changes
   - Test results
   - Any breaking changes noted

## Commit Message Format

Use conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

Examples:
```
feat: add rich text formatting toolbar
fix: resolve cursor position bug on concurrent edits
docs: update deployment guide for Railway
refactor: extract WebSocket logic into separate module
```

## Code Review

All PRs will be reviewed for:
- Code quality and readability
- Test coverage
- Performance impact
- Security considerations
- Documentation updates

## Questions?

- Open an issue for bugs or feature requests
- Tag issues with appropriate labels
- Be respectful and constructive

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing! 🚀

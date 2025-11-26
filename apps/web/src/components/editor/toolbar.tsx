'use client';

import { useState } from 'react';
import { type Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
    Bold,
    Italic,
    Strikethrough,
    Code,
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    Quote,
    Undo,
    Redo,
    Link as LinkIcon,
    Image as ImageIcon,
} from 'lucide-react';
import { LinkDialog } from './link-dialog';
import { ImageDialog } from './image-dialog';

interface EditorToolbarProps {
    editor: Editor;
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
    const [linkDialogOpen, setLinkDialogOpen] = useState(false);
    const [imageDialogOpen, setImageDialogOpen] = useState(false);
    const [existingLink, setExistingLink] = useState<{ url?: string; text?: string; openInNewTab?: boolean } | null>(null);

    const handleLinkButtonClick = () => {
        // Check if there's an existing link at the cursor
        const attrs = editor.getAttributes('link');
        const { from, to } = editor.state.selection;
        const selectedText = editor.state.doc.textBetween(from, to, ' ');

        if (attrs.href) {
            // Pre-fill with existing link data
            setExistingLink({
                url: attrs.href,
                text: selectedText || attrs.href,
                openInNewTab: attrs.target === '_blank',
            });
        } else if (selectedText) {
            // Pre-fill with selected text
            setExistingLink({
                url: '',
                text: selectedText,
                openInNewTab: false,
            });
        } else {
            setExistingLink(null);
        }

        setLinkDialogOpen(true);
    };

    const handleInsertLink = (url: string, text?: string, openInNewTab?: boolean) => {
        // Remove existing link if editing
        if (existingLink?.url) {
            editor.chain().focus().unsetLink().run();
        }
        const linkAttributes: { href: string; target?: string; rel?: string } = { href: url };
        
        if (openInNewTab) {
            linkAttributes.target = '_blank';
            linkAttributes.rel = 'noopener noreferrer'; // Security best practice
        }

        // If text is provided, insert a new link with that text
        if (text) {
            editor
                .chain()
                .focus()
                .insertContent(`<a href="${url}"${openInNewTab ? ' target="_blank" rel="noopener noreferrer"' : ''}>${text}</a>`)
                .run();
        } else {
            // If text is selected, convert it to a link
            // Otherwise, just set the link at cursor position
            const { from, to } = editor.state.selection;
            const selectedText = editor.state.doc.textBetween(from, to);
            
            if (selectedText) {
                // Replace selected text with link
                editor
                    .chain()
                    .focus()
                    .deleteRange({ from, to })
                    .insertContent(`<a href="${url}"${openInNewTab ? ' target="_blank" rel="noopener noreferrer"' : ''}>${selectedText}</a>`)
                    .run();
            } else {
                // Set link at cursor (TipTap will handle this)
                editor.chain().focus().setLink(linkAttributes).run();
            }
        }

        setExistingLink(null);
    };

    const handleInsertImage = (src: string, alt?: string) => {
        editor.chain().focus().setImage({ src, alt: alt || '' }).run();
    };

    return (
        <div className="flex flex-wrap items-center gap-1 border-b p-2">
            {/* Text Formatting */}
            <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={editor.isActive('bold') ? 'bg-accent' : ''}
            >
                <Bold className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={editor.isActive('italic') ? 'bg-accent' : ''}
            >
                <Italic className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleStrike().run()}
                className={editor.isActive('strike') ? 'bg-accent' : ''}
            >
                <Strikethrough className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleCode().run()}
                className={editor.isActive('code') ? 'bg-accent' : ''}
            >
                <Code className="h-4 w-4" />
            </Button>

            <Separator orientation="vertical" className="mx-1 h-6" />

            {/* Headings */}
            <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={editor.isActive('heading', { level: 1 }) ? 'bg-accent' : ''}
            >
                <Heading1 className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={editor.isActive('heading', { level: 2 }) ? 'bg-accent' : ''}
            >
                <Heading2 className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                className={editor.isActive('heading', { level: 3 }) ? 'bg-accent' : ''}
            >
                <Heading3 className="h-4 w-4" />
            </Button>

            <Separator orientation="vertical" className="mx-1 h-6" />

            {/* Lists */}
            <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={editor.isActive('bulletList') ? 'bg-accent' : ''}
            >
                <List className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={editor.isActive('orderedList') ? 'bg-accent' : ''}
            >
                <ListOrdered className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={editor.isActive('blockquote') ? 'bg-accent' : ''}
            >
                <Quote className="h-4 w-4" />
            </Button>

            <Separator orientation="vertical" className="mx-1 h-6" />

            {/* Media */}
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLinkButtonClick}
                className={editor.isActive('link') ? 'bg-accent' : ''}
            >
                <LinkIcon className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setImageDialogOpen(true)}>
                <ImageIcon className="h-4 w-4" />
            </Button>

            <Separator orientation="vertical" className="mx-1 h-6" />

            {/* Undo/Redo */}
            <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
            >
                <Undo className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
            >
                <Redo className="h-4 w-4" />
            </Button>
            
            {/* Dialogs */}
            <LinkDialog
                open={linkDialogOpen}
                onOpenChange={(open) => {
                    setLinkDialogOpen(open);
                    if (!open) {
                        setExistingLink(null);
                    }
                }}
                onInsert={handleInsertLink}
                initialUrl={existingLink?.url}
                initialText={existingLink?.text}
                initialOpenInNewTab={existingLink?.openInNewTab}
            />
            <ImageDialog
                open={imageDialogOpen}
                onOpenChange={setImageDialogOpen}
                onInsert={handleInsertImage}
            />
        </div>
    );
}

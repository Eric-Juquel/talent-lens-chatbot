import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@/tests/test-utils';
import userEvent from '@testing-library/user-event';
import { DropZone, DOCUMENT_MIMETYPES } from '../components/DropZone';

const defaultProps = {
  label: 'CV',
  hint: 'PDF, Word ou TXT',
  dropText: 'Glissez ici',
  browseText: 'Parcourir',
  file: null,
  onFile: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('DropZone', () => {
  describe('initial render', () => {
    it('renders label and hint text', () => {
      render(<DropZone {...defaultProps} />);
      expect(screen.getByText('CV')).toBeInTheDocument();
      expect(screen.getByText('PDF, Word ou TXT')).toBeInTheDocument();
    });

    it('renders drop text and browse text', () => {
      render(<DropZone {...defaultProps} />);
      expect(screen.getByText('Glissez ici')).toBeInTheDocument();
      expect(screen.getByText('Parcourir')).toBeInTheDocument();
    });

    it('does not show optional badge by default', () => {
      render(<DropZone {...defaultProps} />);
      expect(screen.queryByText('Optionnel')).not.toBeInTheDocument();
    });

    it('shows optional badge when optional=true', () => {
      render(<DropZone {...defaultProps} optional />);
      expect(screen.getByText('Optionnel')).toBeInTheDocument();
    });

    it('renders a hidden file input', () => {
      const { container } = render(<DropZone {...defaultProps} />);
      const input = container.querySelector('input[type="file"]');
      expect(input).toBeInTheDocument();
      expect(input).toHaveClass('sr-only');
    });
  });

  describe('with file selected', () => {
    it('shows the file name', () => {
      const file = new File(['content'], 'resume.pdf', { type: 'application/pdf' });
      render(<DropZone {...defaultProps} file={file} />);
      expect(screen.getByText('resume.pdf')).toBeInTheDocument();
    });

    it('does not show drop zone button when file is present', () => {
      const file = new File(['content'], 'resume.pdf', { type: 'application/pdf' });
      render(<DropZone {...defaultProps} file={file} />);
      expect(screen.queryByText('Glissez ici')).not.toBeInTheDocument();
    });

    it('shows remove button', () => {
      const file = new File(['content'], 'resume.pdf', { type: 'application/pdf' });
      render(<DropZone {...defaultProps} file={file} />);
      expect(screen.getByRole('button', { name: /retirer le fichier/i })).toBeInTheDocument();
    });

    it('calls onFile(null) when remove button is clicked', async () => {
      const user = userEvent.setup();
      const onFile = vi.fn();
      const file = new File(['content'], 'resume.pdf', { type: 'application/pdf' });
      render(<DropZone {...defaultProps} file={file} onFile={onFile} />);

      await user.click(screen.getByRole('button', { name: /retirer le fichier/i }));
      expect(onFile).toHaveBeenCalledWith(null);
    });
  });

  describe('file input selection', () => {
    it('calls onFile when a valid file is selected via input', async () => {
      const onFile = vi.fn();
      const { container } = render(<DropZone {...defaultProps} onFile={onFile} />);

      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['content'], 'resume.pdf', { type: 'application/pdf' });
      await userEvent.upload(input, file);

      expect(onFile).toHaveBeenCalledWith(file);
    });

    it('uses DOCUMENT_MIMETYPES as default accepted types when provided', () => {
      const { container } = render(<DropZone {...defaultProps} acceptedTypes={DOCUMENT_MIMETYPES} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      expect(input.accept).toContain('application/pdf');
    });
  });

  describe('drag and drop', () => {
    it('adds dragging class on dragOver', () => {
      render(<DropZone {...defaultProps} />);
      const dropzone = screen.getByRole('button', { name: /glissez ici/i });

      fireEvent.dragOver(dropzone);
      expect(dropzone).toHaveClass('border-primary');
    });

    it('removes dragging class on dragLeave', () => {
      render(<DropZone {...defaultProps} />);
      const dropzone = screen.getByRole('button', { name: /glissez ici/i });

      fireEvent.dragOver(dropzone);
      fireEvent.dragLeave(dropzone);
      expect(dropzone).not.toHaveClass('bg-primary/10');
    });

    it('calls onFile with valid dropped file', () => {
      const onFile = vi.fn();
      render(<DropZone {...defaultProps} onFile={onFile} acceptedTypes={['application/pdf']} />);
      const dropzone = screen.getByRole('button', { name: /glissez ici/i });

      const file = new File(['content'], 'resume.pdf', { type: 'application/pdf' });
      fireEvent.drop(dropzone, { dataTransfer: { files: [file] } });

      expect(onFile).toHaveBeenCalledWith(file);
    });

    it('does not call onFile with invalid file type', () => {
      const onFile = vi.fn();
      render(<DropZone {...defaultProps} onFile={onFile} acceptedTypes={['application/pdf']} />);
      const dropzone = screen.getByRole('button', { name: /glissez ici/i });

      const file = new File(['content'], 'image.png', { type: 'image/png' });
      fireEvent.drop(dropzone, { dataTransfer: { files: [file] } });

      expect(onFile).not.toHaveBeenCalled();
    });

    it('clears dragging state after drop', () => {
      render(<DropZone {...defaultProps} />);
      const dropzone = screen.getByRole('button', { name: /glissez ici/i });

      fireEvent.dragOver(dropzone);
      fireEvent.drop(dropzone, { dataTransfer: { files: [] } });
      expect(dropzone).not.toHaveClass('bg-primary/10');
    });
  });
});

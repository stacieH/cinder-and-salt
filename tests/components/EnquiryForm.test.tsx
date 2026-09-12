import { render, screen, fireEvent } from '@testing-library/react';
import EnquiryForm from '@/components/contact/EnquiryForm';

describe('EnquiryForm', () => {
  it('shows validation errors when submitted empty', () => {
    render(<EnquiryForm />);

    fireEvent.click(screen.getByRole('button', { name: 'Send enquiry' }));

    expect(screen.getByText('Please tell us your name')).toBeInTheDocument();
    expect(screen.getByText('Enter a valid email address')).toBeInTheDocument();
  });

  it('confirms the enquiry once every field is valid', () => {
    render(<EnquiryForm />);

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Alex' } });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'alex@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Preferred date'), {
      target: { value: '2026-10-02' },
    });
    fireEvent.change(screen.getByLabelText('Guests'), { target: { value: '4' } });
    fireEvent.change(screen.getByLabelText('Message'), {
      target: { value: 'Birthday dinner' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Send enquiry' }));

    expect(screen.getByRole('status')).toHaveTextContent(
      'Thank you — we will reply within one working day.',
    );
  });

  it('marks an invalid field with aria-invalid and points aria-describedby at its visible error', () => {
    render(<EnquiryForm />);

    fireEvent.click(screen.getByRole('button', { name: 'Send enquiry' }));

    const nameInput = screen.getByLabelText('Name');
    expect(nameInput).toHaveAttribute('aria-invalid', 'true');

    const describedBy = nameInput.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();

    const errorNode = document.getElementById(describedBy as string);
    expect(errorNode).not.toBeNull();
    expect(errorNode).toHaveTextContent('Please tell us your name');
  });

  it('announces each validation error to assistive technology via role="alert"', () => {
    render(<EnquiryForm />);

    fireEvent.click(screen.getByRole('button', { name: 'Send enquiry' }));

    const alerts = screen.getAllByRole('alert');
    const alertText = alerts.map((node) => node.textContent);

    expect(alertText).toContain('Please tell us your name');
    expect(alertText).toContain('Enter a valid email address');
  });

  it('does not mark a valid field as invalid and omits aria-describedby entirely', () => {
    render(<EnquiryForm />);

    fireEvent.click(screen.getByRole('button', { name: 'Send enquiry' }));

    // Guests defaults to '2' in EMPTY_ENQUIRY, which passes validation even
    // on an otherwise-empty submit, so it stays clean while name/email fail.
    const guestsInput = screen.getByLabelText('Guests');
    expect(guestsInput).toHaveAttribute('aria-invalid', 'false');
    expect(guestsInput).not.toHaveAttribute('aria-describedby');
  });

  it('re-validates on change so a corrected field clears its own error immediately', () => {
    render(<EnquiryForm />);

    fireEvent.click(screen.getByRole('button', { name: 'Send enquiry' }));
    const nameInput = screen.getByLabelText('Name');
    expect(nameInput).toHaveAttribute('aria-invalid', 'true');

    fireEvent.change(nameInput, { target: { value: 'Alex' } });

    expect(screen.queryByText('Please tell us your name')).not.toBeInTheDocument();
    expect(nameInput).toHaveAttribute('aria-invalid', 'false');
    expect(nameInput).not.toHaveAttribute('aria-describedby');
  });
});

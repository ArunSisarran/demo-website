// Native constraint validation, surfaced as text. Validates on blur and on
// submit — never on every keystroke, which punishes people mid-word.
export function enhance(form) {
  const fields = form.querySelectorAll('.field-input');

  const check = (field) => {
    const valid = field.checkValidity();
    field.setAttribute('aria-invalid', String(!valid));
    const error = field.parentElement?.querySelector('.field-error');
    if (error) error.textContent = valid ? '' : field.validationMessage;
    return valid;
  };

  fields.forEach((field) => {
    field.addEventListener('blur', () => check(field));
    // Once a field is marked bad, correcting it should clear the error promptly.
    field.addEventListener('input', () => {
      if (field.getAttribute('aria-invalid') === 'true') check(field);
    });
  });

  form.addEventListener('submit', (event) => {
    const firstBad = [...fields].filter((f) => !check(f))[0];
    if (firstBad) {
      event.preventDefault();
      firstBad.focus();
    }
  });
}

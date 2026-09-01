export function isGreenhouseApplicationPage(): boolean {
  return !!(
    document.querySelector('#application_form') ||
    document.querySelector('#application-form') ||
    document.querySelector('form.application--form') ||
    document.querySelector('#main_fields') ||
    document.querySelector('.application-form') ||
    window.location.pathname.includes('/apply') ||
    window.location.pathname.includes('/embed')
  )
}

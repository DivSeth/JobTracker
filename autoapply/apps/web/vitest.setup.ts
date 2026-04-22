import '@testing-library/jest-dom'
import { configure } from '@testing-library/dom'

// Exclude <option> elements from getByText queries — options are
// queried via getByRole('option') or getByDisplayValue instead.
configure({ defaultIgnore: 'script, style, option' })

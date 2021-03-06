import { createInteractor, perform, focused, focus, blur } from '../index';
import { isVisible } from 'element-is-visible';

function isButtonElement(element: HTMLInputElement | HTMLButtonElement): element is HTMLButtonElement {
  return element.tagName === 'BUTTON';
}

const ButtonInteractor = createInteractor<HTMLInputElement | HTMLButtonElement>('button')({
  selector: 'button,input[type=button],input[type=submit],input[type=reset],input[type=image]',
  locator(element) {
    if(isButtonElement(element)) {
      return element.textContent || '';
    } else if(element.type === 'image') {
      return element.alt;
    } else {
      return element.value;
    }
  },
  filters: {
    title: (element) => element.title,
    id: (element) => element.id,
    visible: { apply: isVisible, default: true },
    disabled: {
      apply: (element) => element.disabled,
      default: false
    },
    focused
  },
  actions: {
    click: perform((element) => { element.click(); }),
    focus,
    blur
  },
});

/**
 * Call this {@link InteractorConstructor} to initialize a button {@link Interactor}.
 * The button interactor can be used to interact with buttons on the page and
 * to assert on their state.
 *
 * The button is located by the visible text on the button.
 *
 * ### Example
 *
 * ``` typescript
 * await Button('Submit').click();
 * await Button('Submit').is({ disabled: true });
 * await Button({ id: 'submit-button', disabled: true }).exists();
 * ```
 *
 * ### Filters
 *
 * - `title`: *string* – Filter by title
 * - `id`: *string* – Filter by id
 * - `visible`: *boolean* – Filter by visibility. Defaults to `true`. See {@link isVisible}.
 * - `disabled`: *boolean* – Filter by whether the button is disabled. Defaults to `false`.
 * - `focused`: *boolean* – Filter by whether the button is focused. See {@link focused}.
 *
 * ### Actions
 *
 * - `click()`: *{@link Interaction}* – Click on the button
 * - `focus()`: *{@link Interaction}* – Move focus to the button
 * - `blur()`: *{@link Interaction}* – Move focus away from the button
 *
 * @category Interactor
 */
export const Button = ButtonInteractor;

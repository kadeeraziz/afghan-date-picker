import {
  addAfghanDays,
  compareAfghanDates,
  formatAfghanDate,
  formatGregorianISO,
  formatMonthYear,
  fromGregorian,
  getLocale,
  getMonthGrid,
  isAfghanDateInRange,
  MAX_AFGHAN_YEAR,
  MIN_AFGHAN_YEAR,
  parseAfghanDate,
  parseGregorianISO,
  toGregorian,
  validateAfghanDate
} from './core/index.js';
import type { AfghanDate, Locale, NumeralSystem } from './core/types.js';

export interface PickerOptions {
  locale?: Locale;
  numerals?: NumeralSystem;
  initialDate?: AfghanDate;
  minDate?: AfghanDate;
  maxDate?: AfghanDate;
  target?: string | HTMLInputElement;
  timeZone?: string;
  now?: () => Date;
  showTodayButton?: boolean;
  showClearButton?: boolean;
  closeOnSelect?: boolean;
}

export interface DateChangeDetail {
  afghanDate: AfghanDate;
  gregorianDate: string;
}

export interface DateClearDetail {
  afghanDate: undefined;
  gregorianDate: undefined;
}

export interface DatePicker {
  readonly element: HTMLElement;
  open(): void;
  close(): void;
  destroy(): void;
  getDate(): AfghanDate | undefined;
  setDate(date: AfghanDate): void;
  clear(): void;
}

const DEFAULT_OPTIONS: Required<Pick<PickerOptions, 'locale' | 'numerals' | 'showTodayButton' | 'showClearButton' | 'closeOnSelect'>> = {
  locale: 'dari',
  numerals: 'persian',
  showTodayButton: true,
  showClearButton: true,
  closeOnSelect: true
};

let pickerId = 0;
const DEFAULT_TIME_ZONE = 'Asia/Kabul';
const defaultNow = (): Date => new Date();

function cloneDate(date: AfghanDate | undefined): AfghanDate | undefined {
  return date ? { ...date } : undefined;
}

function isLocale(value: string | undefined): value is Locale {
  return value === 'dari' || value === 'pashto' || value === 'english';
}

function isNumeralSystem(value: string | undefined): value is NumeralSystem {
  return value === 'latin' || value === 'persian';
}

function resolveTarget(input: HTMLInputElement, target: PickerOptions['target']): HTMLInputElement | undefined {
  if (!target) return undefined;
  if (typeof target !== 'string') return target;
  const element = input.ownerDocument.querySelector(target);
  return element instanceof input.ownerDocument.defaultView!.HTMLInputElement ? element : undefined;
}

function getTodayInTimeZone(timeZone: string, now: () => Date): AfghanDate {
  const parts = new Intl.DateTimeFormat('en-US', {
    calendar: 'gregory',
    day: '2-digit',
    month: '2-digit',
    numberingSystem: 'latn',
    timeZone,
    year: 'numeric'
  }).formatToParts(now());
  const values: Record<string, string> = {};
  parts.forEach((part) => {
    values[part.type] = part.value;
  });
  return fromGregorian({
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day)
  });
}

function getTargetDate(target: HTMLInputElement | undefined): AfghanDate | undefined {
  if (!target?.value) return undefined;
  return fromGregorian(parseGregorianISO(target.value));
}

function getInitialDate(input: HTMLInputElement, targetDate: AfghanDate | undefined, options: PickerOptions): AfghanDate {
  if (options.initialDate) {
    validateAfghanDate(options.initialDate);
    return cloneDate(options.initialDate)!;
  }

  if (input.value.trim()) {
    try {
      return parseAfghanDate(input.value);
    } catch {
      // A partially typed value should not prevent the picker from opening.
    }
  }

  return cloneDate(targetDate) ?? getTodayInTimeZone(
    options.timeZone ?? DEFAULT_TIME_ZONE,
    options.now ?? defaultNow
  );
}

function formatAccessibleDate(date: AfghanDate, locale: Locale, numerals: NumeralSystem): string {
  return formatAfghanDate(date, { locale, numerals, separator: '/' });
}

export function createAfghanDatePicker(input: HTMLInputElement, suppliedOptions: PickerOptions = {}): DatePicker {
  const options = { ...DEFAULT_OPTIONS, ...suppliedOptions };
  const target = resolveTarget(input, options.target ?? input.dataset.afghanTarget);
  const localeData = getLocale(options.locale);
  const doc = input.ownerDocument;
  const targetDate = getTargetDate(target);
  const initialDate = getInitialDate(input, targetDate, options);
  let selectedDate: AfghanDate | undefined;
  if (options.initialDate) {
    selectedDate = cloneDate(options.initialDate);
  } else if (input.value) {
    try {
      selectedDate = parseAfghanDate(input.value);
    } catch {
      selectedDate = undefined;
    }
  } else if (!input.value.trim() && targetDate) {
    selectedDate = cloneDate(targetDate);
  }
  let viewDate = cloneDate(selectedDate ?? initialDate)!;
  let isOpen = false;
  let isRestoringFocus = false;
  let previousFocus: HTMLElement | null = null;

  const id = `afghan-date-picker-${++pickerId}`;
  const popup = doc.createElement('div');
  popup.className = 'afghan-date-picker';
  popup.id = id;
  popup.hidden = true;
  popup.setAttribute('role', 'dialog');
  popup.setAttribute('aria-modal', 'true');
  popup.setAttribute('aria-label', localeData.chooseDate);
  popup.dir = options.locale === 'english' ? 'ltr' : 'rtl';

  const header = doc.createElement('div');
  header.className = 'afghan-date-picker__header';

  const previousButton = doc.createElement('button');
  previousButton.type = 'button';
  previousButton.className = 'afghan-date-picker__nav';
  previousButton.setAttribute('aria-label', localeData.previousMonth);
  previousButton.textContent = options.locale === 'english' ? '←' : '→';

  const title = doc.createElement('h2');
  title.className = 'afghan-date-picker__title';

  const nextButton = doc.createElement('button');
  nextButton.type = 'button';
  nextButton.className = 'afghan-date-picker__nav';
  nextButton.setAttribute('aria-label', localeData.nextMonth);
  nextButton.textContent = options.locale === 'english' ? '→' : '←';

  header.append(previousButton, title, nextButton);

  const grid = doc.createElement('div');
  grid.className = 'afghan-date-picker__grid';
  grid.setAttribute('role', 'grid');
  grid.setAttribute('aria-labelledby', `${id}-title`);

  title.id = `${id}-title`;
  const footer = doc.createElement('div');
  footer.className = 'afghan-date-picker__footer';

  const todayButton = doc.createElement('button');
  todayButton.type = 'button';
  todayButton.className = 'afghan-date-picker__action';
  todayButton.textContent = localeData.today;

  const clearButton = doc.createElement('button');
  clearButton.type = 'button';
  clearButton.className = 'afghan-date-picker__action afghan-date-picker__action--quiet';
  clearButton.textContent = localeData.clear;

  if (options.showTodayButton) footer.append(todayButton);
  if (options.showClearButton) footer.append(clearButton);
  popup.append(header, grid, footer);
  doc.body.append(popup);

  input.setAttribute('aria-haspopup', 'dialog');
  input.setAttribute('aria-controls', id);
  input.setAttribute('autocomplete', input.getAttribute('autocomplete') ?? 'off');

  function isSelectable(date: AfghanDate): boolean {
    return isAfghanDateInRange(date, options.minDate, options.maxDate);
  }

  function dispatchChange(date: AfghanDate): void {
    const gregorianDate = formatGregorianISO(toGregorian(date));
    const detail: DateChangeDetail = { afghanDate: cloneDate(date)!, gregorianDate };
    input.dispatchEvent(new CustomEvent<DateChangeDetail>('afghan-date-change', { bubbles: true, detail }));
  }

  function dispatchClear(): void {
    const detail: DateClearDetail = { afghanDate: undefined, gregorianDate: undefined };
    input.dispatchEvent(new CustomEvent<DateClearDetail>('afghan-date-clear', { bubbles: true, detail }));
  }

  function commit(date: AfghanDate): void {
    if (!isSelectable(date)) return;
    const shouldKeepGridFocus = isOpen && !options.closeOnSelect;
    selectedDate = cloneDate(date);
    viewDate = cloneDate(date)!;
    input.value = formatAccessibleDate(date, options.locale, options.numerals);
    input.removeAttribute('aria-invalid');
    if (target) target.value = formatGregorianISO(toGregorian(date));
    dispatchChange(date);
    render();
    if (shouldKeepGridFocus) {
      const selectedButton = grid.querySelector<HTMLButtonElement>(`.afghan-date-picker__day:not(:disabled)[data-date="${formatAfghanDate(date, { numerals: 'latin', separator: '-' })}"]`);
      (selectedButton ?? grid).focus();
    }
    if (options.closeOnSelect) close();
  }

  function render(): void {
    title.textContent = formatMonthYear(viewDate, { locale: options.locale, numerals: options.numerals });
    grid.replaceChildren();
    const today = getTodayInTimeZone(options.timeZone ?? DEFAULT_TIME_ZONE, options.now ?? defaultNow);

    const weekdayRow = doc.createElement('div');
    weekdayRow.className = 'afghan-date-picker__weekdays';
    weekdayRow.setAttribute('role', 'row');
    localeData.weekdays.forEach((weekday) => {
      const heading = doc.createElement('span');
      heading.className = 'afghan-date-picker__weekday';
      heading.setAttribute('role', 'columnheader');
      heading.textContent = weekday.slice(0, options.locale === 'english' ? 3 : 1);
      heading.setAttribute('aria-label', weekday);
      weekdayRow.append(heading);
    });
    grid.append(weekdayRow);

    const cells = getMonthGrid(viewDate.year, viewDate.month);
    for (let rowIndex = 0; rowIndex < 6; rowIndex += 1) {
      const row = doc.createElement('div');
      row.className = 'afghan-date-picker__week';
      row.setAttribute('role', 'row');
      cells.slice(rowIndex * 7, rowIndex * 7 + 7).forEach((cell) => {
        const cellElement = doc.createElement('div');
        cellElement.className = 'afghan-date-picker__cell';
        cellElement.setAttribute('role', 'gridcell');

        const dayButton = doc.createElement('button');
        dayButton.type = 'button';
        dayButton.className = 'afghan-date-picker__day';
        dayButton.dataset.date = formatAfghanDate(cell.date, { numerals: 'latin', separator: '-' });
        dayButton.textContent = formatAfghanDate(cell.date, { numerals: options.numerals, separator: '/' }).split('/')[2];
        dayButton.setAttribute('aria-label', formatAccessibleDate(cell.date, options.locale, options.numerals));
        dayButton.tabIndex = -1;
        if (!cell.inCurrentMonth) dayButton.classList.add('afghan-date-picker__day--outside');
        if (!isSelectable(cell.date)) {
          dayButton.disabled = true;
          dayButton.classList.add('afghan-date-picker__day--disabled');
        }
        if (selectedDate && compareAfghanDates(selectedDate, cell.date) === 0) {
          dayButton.setAttribute('aria-selected', 'true');
          dayButton.classList.add('afghan-date-picker__day--selected');
        }
        if (compareAfghanDates(today, cell.date) === 0) {
          dayButton.setAttribute('aria-current', 'date');
          dayButton.classList.add('afghan-date-picker__day--today');
        }
        cellElement.append(dayButton);
        row.append(cellElement);
      });
      grid.append(row);
    }

    const focusableDays = [...grid.querySelectorAll<HTMLButtonElement>('.afghan-date-picker__day:not(:disabled)')];
    const selectedButton = selectedDate
      ? focusableDays.find((button) => button.dataset.date === formatAfghanDate(selectedDate!, { numerals: 'latin', separator: '-' }))
      : undefined;
    (selectedButton ?? focusableDays.find((button) => !button.classList.contains('afghan-date-picker__day--outside')) ?? focusableDays[0])?.setAttribute('tabindex', '0');
    grid.tabIndex = focusableDays.length > 0 ? -1 : 0;
  }

  function positionPopup(): void {
    if (!isOpen) return;
    const rect = input.getBoundingClientRect();
    const viewportWidth = doc.defaultView?.innerWidth || doc.documentElement.clientWidth;
    const viewportHeight = doc.defaultView?.innerHeight || doc.documentElement.clientHeight;
    const popupRect = popup.getBoundingClientRect();
    const maxLeft = Math.max(8, viewportWidth - popupRect.width - 8);
    const maxTop = Math.max(8, viewportHeight - popupRect.height - 8);
    const topBelow = rect.bottom + 8;
    const topAbove = rect.top - popupRect.height - 8;
    const top = popupRect.height > 0 && topBelow > maxTop && topAbove >= 8
      ? topAbove
      : Math.min(Math.max(8, topBelow), maxTop);
    popup.style.top = `${top}px`;
    popup.style.left = `${Math.min(Math.max(8, rect.left), maxLeft)}px`;
  }

  function close(): void {
    if (!isOpen) return;
    isOpen = false;
    popup.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    if (previousFocus && previousFocus.isConnected) {
      isRestoringFocus = true;
      previousFocus.focus();
      isRestoringFocus = false;
    }
  }

  function open(): void {
    if (isOpen) return;
    isOpen = true;
    previousFocus = doc.activeElement instanceof HTMLElement ? doc.activeElement : input;
    popup.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    render();
    positionPopup();
    const selectedButton = selectedDate
      ? grid.querySelector<HTMLButtonElement>(`.afghan-date-picker__day:not(:disabled)[data-date="${formatAfghanDate(selectedDate, { numerals: 'latin', separator: '-' })}"]`)
      : undefined;
    const focusTarget = selectedButton ?? grid.querySelector<HTMLButtonElement>('.afghan-date-picker__day[tabindex="0"]');
    (focusTarget ?? grid).focus();
  }

  function clear(): void {
    selectedDate = undefined;
    input.value = '';
    input.removeAttribute('aria-invalid');
    if (target) target.value = '';
    dispatchClear();
    render();
    close();
  }

  function changeMonth(amount: number): void {
    const monthIndex = viewDate.year * 12 + viewDate.month - 1 + amount;
    const year = Math.floor(monthIndex / 12);
    const month = (monthIndex % 12) + 1;
    if (year < MIN_AFGHAN_YEAR || year > MAX_AFGHAN_YEAR) return;
    viewDate = { year, month, day: 1 };
    render();
    const focusTarget = grid.querySelector<HTMLButtonElement>('.afghan-date-picker__day[tabindex="0"]');
    (focusTarget ?? grid).focus();
  }

  function moveFocus(button: HTMLButtonElement, offset: number): void {
    const allButtons = [...grid.querySelectorAll<HTMLButtonElement>('.afghan-date-picker__day')];
    const currentIndex = allButtons.indexOf(button);
    let targetIndex = currentIndex + offset;
    while (targetIndex >= 0 && targetIndex < allButtons.length && allButtons[targetIndex].disabled) {
      targetIndex += Math.sign(offset);
    }
    const targetButton = allButtons[targetIndex];
    if (!targetButton) {
      button.focus();
      return;
    }
    allButtons.forEach((day) => day.setAttribute('tabindex', '-1'));
    targetButton.setAttribute('tabindex', '0');
    targetButton.focus();
  }

  function moveFocusTo(button: HTMLButtonElement, targetIndex: number): void {
    const allButtons = [...grid.querySelectorAll<HTMLButtonElement>('.afghan-date-picker__day')];
    const currentIndex = allButtons.indexOf(button);
    let index = targetIndex;
    const direction = index >= currentIndex ? 1 : -1;
    while (index >= 0 && index < allButtons.length && allButtons[index].disabled) index += direction;
    const targetButton = allButtons[index];
    if (!targetButton) {
      button.focus();
      return;
    }
    allButtons.forEach((day) => day.setAttribute('tabindex', '-1'));
    targetButton.setAttribute('tabindex', '0');
    targetButton.focus();
  }

  function onGridKeyDown(event: KeyboardEvent): void {
    const button = event.target instanceof HTMLButtonElement && event.target.classList.contains('afghan-date-picker__day')
      ? event.target
      : undefined;
    if (!button) return;

    if (event.key === 'Escape') {
      close();
      event.preventDefault();
      return;
    }
    const horizontalStep = popup.dir === 'rtl' ? -1 : 1;
    if (event.key === 'ArrowRight') moveFocus(button, horizontalStep);
    else if (event.key === 'ArrowLeft') moveFocus(button, -horizontalStep);
    else if (event.key === 'ArrowDown') moveFocus(button, 7);
    else if (event.key === 'ArrowUp') moveFocus(button, -7);
    else if (event.key === 'Home') {
      const index = [...grid.querySelectorAll<HTMLButtonElement>('.afghan-date-picker__day')].indexOf(button);
      moveFocusTo(button, Math.floor(index / 7) * 7);
    } else if (event.key === 'End') {
      const index = [...grid.querySelectorAll<HTMLButtonElement>('.afghan-date-picker__day')].indexOf(button);
      moveFocusTo(button, Math.floor(index / 7) * 7 + 6);
    }
    else if (event.key === 'PageUp') changeMonth(event.shiftKey ? -12 : -1);
    else if (event.key === 'PageDown') changeMonth(event.shiftKey ? 12 : 1);
    else if (event.key === 'Enter' || event.key === ' ') {
      const date = parseAfghanDate(button.dataset.date!.replaceAll('-', '/'));
      commit(date);
    } else {
      return;
    }
    event.preventDefault();
  }

  function onInputChange(): void {
    if (!input.value.trim()) {
      clear();
      return;
    }
    try {
      const date = parseAfghanDate(input.value);
      if (!isSelectable(date)) throw new RangeError('Date is outside the allowed range.');
      commit(date);
    } catch {
      input.setAttribute('aria-invalid', 'true');
      input.dispatchEvent(new CustomEvent('afghan-date-invalid', {
        bubbles: true,
        detail: { value: input.value, message: localeData.invalidDate }
      }));
    }
  }

  function onDocumentClick(event: MouseEvent): void {
    const node = event.target;
    if (node instanceof Node && !popup.contains(node) && node !== input) close();
  }

  previousButton.addEventListener('click', () => changeMonth(-1));
  nextButton.addEventListener('click', () => changeMonth(1));
  todayButton.addEventListener('click', () => {
    const today = getTodayInTimeZone(options.timeZone ?? DEFAULT_TIME_ZONE, options.now ?? defaultNow);
    if (isSelectable(today)) commit(today);
  });
  clearButton.addEventListener('click', clear);
  grid.addEventListener('click', (event) => {
    const button = event.target instanceof HTMLButtonElement ? event.target : undefined;
    if (!button || button.disabled || !button.dataset.date) return;
    commit(parseAfghanDate(button.dataset.date.replaceAll('-', '/')));
  });
  grid.addEventListener('keydown', onGridKeyDown);
  input.addEventListener('focus', () => {
    if (!isRestoringFocus) open();
  });
  input.addEventListener('change', onInputChange);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close();
    if (event.key === 'ArrowDown' || event.key === 'Enter') {
      event.preventDefault();
      open();
    }
  });
  doc.addEventListener('mousedown', onDocumentClick);
  doc.defaultView?.addEventListener('resize', positionPopup);
  doc.defaultView?.addEventListener('scroll', positionPopup, true);

  const picker: DatePicker = {
    element: popup,
    open,
    close,
    getDate: () => cloneDate(selectedDate),
    setDate: (date) => {
      validateAfghanDate(date);
      commit(date);
    },
    clear,
    destroy: () => {
      close();
      doc.removeEventListener('mousedown', onDocumentClick);
      doc.defaultView?.removeEventListener('resize', positionPopup);
      doc.defaultView?.removeEventListener('scroll', positionPopup, true);
      popup.remove();
    }
  };

  render();
  input.setAttribute('aria-expanded', 'false');
  if (selectedDate && !input.value) {
    input.value = formatAccessibleDate(selectedDate, options.locale, options.numerals);
  }
  return picker;
}

export interface WatchOptions extends Omit<PickerOptions, 'locale' | 'target'> {
  locale?: Locale | 'attr';
  target?: PickerOptions['target'] | 'attr';
}

export function startWatch(root?: ParentNode, options: WatchOptions = {}): DatePicker[] {
  const scope = root ?? globalThis.document;
  if (!scope) throw new Error('startWatch must run in a browser document.');
  const inputs = [...scope.querySelectorAll<HTMLInputElement>('[data-afghan-date-picker]')];
  return inputs.map((input) => {
    const localeValue = options.locale === 'attr' || !options.locale ? input.dataset.afghanLocale : options.locale;
    const targetValue = options.target === 'attr' || !options.target ? input.dataset.afghanTarget : options.target;
    const minDateValue = input.dataset.afghanMinDate;
    const maxDateValue = input.dataset.afghanMaxDate;
    const initialDateValue = input.dataset.afghanInitialDate;
    return createAfghanDatePicker(input, {
      ...options,
      locale: isLocale(localeValue) ? localeValue : 'dari',
      numerals: isNumeralSystem(input.dataset.afghanNumerals) ? input.dataset.afghanNumerals : options.numerals,
      target: targetValue,
      minDate: minDateValue ? parseAfghanDate(minDateValue) : options.minDate,
      maxDate: maxDateValue ? parseAfghanDate(maxDateValue) : options.maxDate,
      initialDate: initialDateValue ? parseAfghanDate(initialDateValue) : options.initialDate
    });
  });
}
